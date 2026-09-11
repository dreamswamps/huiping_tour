package com.example.Service.Application;

import com.example.Exception.CustomException;
import com.example.Mapper.AdminMapper;
import com.example.Mapper.Application.ApprovalMapper;
import com.example.POJO.Application;
import com.example.POJO.DTO.PageResult;
import com.example.Util.Result;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Service
public class ApprovalService {
    @Resource
    private ApprovalMapper approvalMapper;
    @Resource
    private ApprovalMapService approvalMapService;
    @Resource
    private AdminMapper adminMapper;
    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Value("${jwt.secret}")
    private String jwtSecret;
    @Qualifier("redisTemplate")
    @Autowired
    private RedisTemplate redisTemplate;

    //    boolean需要提供，执行该方法时顺道清理状态异常的申请
    public PageResult<Application> pendingApplication(String type, String apply_account,Integer aid, boolean is_DESC, int is_All, int pageNum, int pageSize) {
        try {
            clearApplication();
            PageHelper.startPage(pageNum, pageSize);
            List<Application> list = approvalMapper.pendingApplication(type, apply_account,aid, is_DESC, is_All);

            return PageResult.fromPageInfo(PageInfo.of(list));
        }catch (Exception e){
            return PageResult.empty(pageNum, pageSize);
        }
    }

//    只能锁定未被其他人锁定的资源，锁定资源后，额外提供一个15时限的密钥并存储至redis
    public String lockApplication(Integer aid, Integer currentUserId) {
        LocalDateTime now = LocalDateTime.now();
        try {
            int result = approvalMapper.lockApplication(aid,currentUserId,now);
            if (result > 0){
                String token = Jwts.builder()
                        .subject(aid.toString())
                        .claim("userId", currentUserId)
                        .expiration(new Date(System.currentTimeMillis() + 6 * 60 * 1000))
                        .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                        .compact();
//              Redis存储密钥
//              该密钥持续时间15分钟，搭配2分钟的短心跳，允许在密钥的生效时间内，出现一次的复苏失败
//              由于订阅了Redis的expire，因此超时的密钥也会被传递，自动释放资源
                stringRedisTemplate.opsForValue().set("lock:token:" + token, "", 2, TimeUnit.MINUTES);
                return token;
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new CustomException("500", e.getMessage());
        }

        return null;
    }

//    在释放状态锁的同时，销毁对应的jwt密钥
    public boolean unlockApplication(Integer aid, String token, Integer currentUserId) {
        stringRedisTemplate.delete("lock:token:" + token);
        return approvalMapper.unlockApplication(aid, currentUserId) > 0;
    }

//    更新审批结果approval。同时需要更新:审批时间，完成状态，禁用状态
//    更新:现在直接传递类，该类应该至少包含了aid,approval,type和reason(可选)
    public Result resultApplication(Application application, Integer currentUserId, String token) {
        try {
//            校验token
            if (!verifyToken(token, application.getAid(), currentUserId)){
                return Result.error("500","密钥错误或失效，请刷新页面");
            }
//            token正确，校验数据库数据
           Application data = approvalMapper.checkWorkerId(application.getAid());
            if (data == null || !Objects.equals(data.getWorker(), currentUserId)) {
                return Result.error("500","你不被允许审批该申请");
            }
            String workerName = adminMapper.GetNameById(currentUserId);
            if (workerName == null) {
                return Result.error("500","管理员身份异常");
            }
//            为了避免传输进乱七八糟的值，只有为1时才设置为1(通过)，其他均为2
            data.setWorker_name(workerName);
            data.setApproval((application.getApproval() == 1) ? 1 : 2);
            data.setFormData(application.getFormData());
            data.setWorker(currentUserId);
            Result result = approvalMapService.dispatch(data);
//            状态码为200表示成功，允许释放资源
            if (Objects.equals(result.getCode(), "200")){
                stringRedisTemplate.delete("lock:token:" + token);
            }
            return result;
        }catch (Exception e) {
            e.printStackTrace();
            return Result.error("600","状态异常");
        }
    }

    public void clearApplication() {
        try {
            LocalDateTime deadline = LocalDateTime.now().minusMinutes(5);
            approvalMapper.clearApplication(deadline);
        }catch (Exception e) {
            throw new CustomException("500", e.getMessage());
        }
    }

//    该心跳检测为长心跳，来源为网页超时
    public Result heartbeat(Integer aid, String token, Integer currentUserId) {
        try {
            Application application = approvalMapper.selectByAid(aid);
            Integer completed = application.getHas_completed();
            Integer working = application.getWorking();
            unlockApplication(aid, token, currentUserId);
            if (completed == 0 && working  == 1) {
                return Result.success("管理员长时间未审批申请，页面将刷新");
            } else if (completed == 1) {
                return Result.success("该申请已经被审批完成且审批时间结束，页面将刷新");
            } else if (working == 0) {
                return Result.success("该申请已被释放且审批时间结束，页面将刷新");
            }
//            这是不可能的，除非修改数据库数据
            return Result.success("不是你怎么做到的？？？");
        }catch (Exception e) {
            return Result.error("状态异常");
        }
    }

    //    短心跳复苏，用于重置Redis中指定token的持续时间
    public Result heartbeatRevive(Integer aid, String token, Integer currentUserId) {
        try {
            if (!verifyToken(token, aid, currentUserId)){
                return Result.error("500", "信息存在不匹配，本次检测失败！");
            }

            if (stringRedisTemplate.expire("lock:token:" + token, 2, TimeUnit.MINUTES)){
                return Result.success("复苏成功");
            }
            return Result.error("复苏失败");
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("500", "复苏异常");
        }
    }

//    检验指定密钥，该方法不会在redis中删除密钥，删除密钥操作统一在unlock操作中
    private boolean verifyToken(String token, Integer aid, Integer currentUserId) {
        String redisKey = "lock:token:" + token;
//        存在指定密钥
        if (stringRedisTemplate.hasKey(redisKey)) {
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

//                验证sub和自定义userId
                if (claims.getSubject().equals(aid.toString())
                && claims.get("userId", Integer.class).equals(currentUserId)) {
                    return true;
                }
            }catch (Exception e){
                e.printStackTrace();
            }
        }
        return false;
    }

//    订阅Redis数据过期，token过期后对token保存数据中的aid进行解锁操作
    public void unlockByRedisMessage(String token){
        Claims claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();
        approvalMapper.unlockApplication(Integer.valueOf(claims.getSubject()), claims.get("userId", Integer.class));
    }

}
