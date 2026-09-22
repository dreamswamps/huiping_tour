package org.huiping.server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.huiping.server.entity.User;
import org.huiping.server.exception.ApiException;
import org.huiping.server.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Random;

@Service
public class LoginService {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final UserMapper userMapper;
    private final String appid;
    private final String secret;
    private final RestClient restClient = RestClient.create();

    public LoginService(UserMapper userMapper,
                        @Value("${app.wechat.appid:}") String appid,
                        @Value("${app.wechat.secret:}") String secret) {
        this.userMapper = userMapper;
        this.appid = appid == null ? "" : appid;
        this.secret = secret == null ? "" : secret;
    }

    /**
     * 微信登录：调用 jscode2session 换取 openid，再查找/创建本地用户。
     * 返回的 Map 固定包含 openid / id / nickname / uid / avatar / dbError；
     * 当 id 为 null 时表示微信已通过但用户未写入数据库（对应 Node 端 code:503）。
     */
    public Map<String, Object> login(String code, String nickname, String avatar) {
        if (secret.isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "服务端未配置小程序 AppSecret，请设置环境变量 WX_MINI_SECRET");
        }

        String displayName = (nickname != null && !nickname.isBlank()) ? nickname.trim() : null;
        String avatarUrl = (avatar != null && !avatar.isBlank()) ? avatar.trim() : null;

        Map<String, Object> wx;
        try {
            /**
             * 微信登录接口jscode2session
             * appid: 小程序唯一标识
             * secret: 小程序密钥
             * js_code: 用户临时登录凭证，来自前端 wx.login()
             * grant_type: 固定值authorization_code
             */
//            TODO 微信接口需要密钥用路径明文传参，日志记录需要绕过
            String uri = UriComponentsBuilder.fromUri(URI.create("https://api.weixin.qq.com/sns/jscode2session"))
                    .queryParam("appid", appid)
                    .queryParam("secret", secret)
                    .queryParam("js_code", code)
                    .queryParam("grant_type", "authorization_code")
                    .toUriString();
//            发送GET请求
            String raw = restClient.get().uri(uri).retrieve().body(String.class);
            wx = MAPPER.readValue(raw, Map.class);
        } catch (Exception e) {
            e.printStackTrace();
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "服务器错误");
        }

//        String.valueOf(errcode) 避开处理errcode本身的数据类型
        Object errcode = wx == null ? null : wx.get("errcode");
        if (errcode != null && !"0".equals(String.valueOf(errcode))) {
//            TODO 记录errmsg
            throw new ApiException(HttpStatus.BAD_REQUEST, "微信登录失败");
        }
        String openid = wx == null ? null : (String) wx.get("openid");
        if (openid == null || openid.isBlank()) {
//            TODO 响应缺少openid
            throw new ApiException(HttpStatus.BAD_REQUEST, "微信登录失败");
        }

        Map<String, Object> result = new LinkedHashMap<>();
//        现以不再允许返回openid
//        result.put("openid", openid);

        try {
            User user = userMapper.findByOpenid(openid);
            if (user != null) {
//                uid缺失的老用户，更新uid
                if (user.getUid() == null || user.getUid().trim().isEmpty()) {
                    // 旧表无 uid 或 uid 为空时补一个
                    String fillUid = createNewUid();
                    userMapper.updateUid(openid, fillUid);
                    user.setUid(fillUid);
                }
                return fillLoginResult(result, user, displayName, avatarUrl);
            }

//            新用户，插入记录
            String newNickname = displayName != null ? displayName : "旅行者" + new Random().nextInt(10000);
            String uid = createNewUid();
//            TODO 先新增后查询获得完整的新增用户记录，有优化空间，优先级低。如果你闲到没事干，再考虑
            userMapper.insert(openid, uid, newNickname, avatarUrl);
            User inserted = userMapper.findByOpenid(openid);
            return fillLoginResult(result, inserted, displayName, avatarUrl);
        } catch (Exception dbError) {
            // 数据库操作失败：微信已通过，但用户数据未写入
//            FIXME dbError 可能包含数据库敏感数据，如库名表名字段名，不应该作为出参
//            TODO 新增开发/生产模式开关，开发模式可出参，生产模式记录日志
            dbError.printStackTrace();
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "登录失败，请稍后重试");
        }
    }

//    封装登录成功结果
    private Map<String, Object> fillLoginResult(Map<String, Object> result, User user,
                                                String displayName, String avatarUrl) {
        if (user == null
                || user.getId() == null
                || user.getId() <= 0
                || user.getUid() == null) {
//            TODO 需要日志
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "用户数据异常");
        }
        result.put("id", user.getId());
        result.put("nickname", user.getNickname() == null ? displayName : user.getNickname());
        result.put("uid", user.getUid());
        result.put("avatar", user.getAvatar() == null ? avatarUrl : user.getAvatar());
        return result;
    }

    /** 生成业务 UID：CX + 当前毫秒时间戳字符串的后 8 位（等价 Node 端 Date.now().toString().slice(-8)）。 */
    private String createNewUid() {
        String ts = String.valueOf(System.currentTimeMillis());
        return "CX" + ts.substring(ts.length() - 8);
    }
}