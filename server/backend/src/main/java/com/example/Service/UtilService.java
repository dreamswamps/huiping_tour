package com.example.Service;

import com.example.Exception.CustomException;
import com.example.Util.Result;
import com.example.Util.ValidateCode.EmailHandlerConfig;
import com.example.Util.ValidateCode.EmailHandlerCreator;
import com.example.Util.ValidateCode.ValidateCodeCreator;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Service
public class UtilService {
    /*
    该service专门用于单独的util功能实现
     */

    @Resource
    private ValidateCodeCreator validateCodeCreator;

    @Resource
    private EmailHandlerCreator emailHandlerCreator;

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Value("${jwt.secret}")
    private String jwtSecret;
//    生成验证码图片
    public void generateValidateCode(HttpServletRequest request, HttpServletResponse response){
        try {
            ValidateCodeCreator.CodeImageResult result = validateCodeCreator.generate();
            HttpSession session = request.getSession();
            session.setAttribute("image_captcha", result.getCode());
            session.setMaxInactiveInterval(5*60);   //  5分钟的有效时间
            response.setContentType("image/png");
            response.setHeader("Cache-Control", "no-cache, no-store");  //  不缓存，不存储
            ImageIO.write(result.getImage(), "PNG", response.getOutputStream());
        }catch (Exception e){
            throw new CustomException("500",e.getMessage());
        }
    }

    // 校验验证码，需要前端提供需要验证哪种类型
    public Result verifyCaptcha(HttpServletRequest request, String code, String type, boolean needKeep) {
        try {
            HttpSession session = request.getSession();
            boolean status = false;

            if ("Image".equals(type)) {
                String captcha = (String) session.getAttribute("image_captcha");
                status = captcha != null && captcha.equalsIgnoreCase(code);
                if (status) session.removeAttribute("image_captcha");
            } else if ("Email".equals(type)) {
                String captcha = (String) session.getAttribute("email_captcha");
                status = captcha != null && captcha.equalsIgnoreCase(code);
                if (status) session.removeAttribute("email_captcha");
            }

            if (status) {
                session.removeAttribute("captcha");

                // 如果需要保留验证状态，生成JWT token
                if (needKeep) {
                    String token = Jwts.builder()
                            .subject("admin_verify")
                            .claim("code", code)
                            .expiration(new Date(System.currentTimeMillis() + 15 * 60 * 1000))
                            .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                            .compact();

                    // Redis存储token
                    stringRedisTemplate.opsForValue().set(
                            "admin:token:" + token,
                            code,
                            15,
                            TimeUnit.MINUTES
                    );

                    return Result.success(token);
                }
            }

            return Result.success(status);
        } catch (Exception e) {
            throw new CustomException("500", e.getMessage());
        }
    }

    // 验证token
    public boolean verifyToken(String token) {
        try {
            // 验证JWT
            Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parse(token);

            // 验证Redis中是否存在
            String key = "admin:token:" + token;
            boolean exists = Boolean.TRUE.equals(stringRedisTemplate.hasKey(key));

            // 如果存在，则删除
            if (exists) {
                stringRedisTemplate.delete(key);
                return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    public Result sendEmail(EmailHandlerConfig config) {
        return emailHandlerCreator.sendEmail(config);
    }

    public Result sendEmailCaptcha(HttpServletRequest request, String to) {
        try {
            String captcha = (String) emailHandlerCreator.sendEmailCaptcha(to).getData();
            HttpSession session = request.getSession();
            session.setAttribute("email_captcha", captcha);
            session.setMaxInactiveInterval(15*60);
            return Result.success("邮件已发送");
        }catch (Exception e){
            throw new CustomException("500",e.getMessage());
        }
    }

}
