package com.example.Util;

import com.example.Exception.CustomException;
import com.example.POJO.Admin;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;


@Component
public class JWTManager {
//    Jwts.SIG自动生成密钥字符串，每次都不一样适合测试
//    选择HS256的算法，最小长度为256位即32个字节
//    选择生成密钥key()并且创建build()
//    private static final SecretKey secretKey = Jwts.SIG.HS256.key().build();

//    从配置文件中获取密钥
    @Value("${jwt.secret}")
    private String secretBase64Key;
//    从配置文件中获取默认持续时长
    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey getSecretKey() {
//        根据配置密钥生成一串用于加密解密的密钥
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretBase64Key));
    }

    public String generateToken(Admin admin) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expiration);
        try {
            return Jwts.builder()
                    .claim("id", String.valueOf(admin.getId()))
                    .claim("role", admin.getRole())
                    .claim("name", admin.getName())
                    .claim("avatar", admin.getAvatar())
                    .claim("email", admin.getEmail())
                    .setIssuedAt(now)  //  设置发布时间，即现在
                    .setExpiration(exp)    //  设置有效时长
                    .signWith(getSecretKey())    //  配置密钥
                    .compact();
        }catch (JwtException e) {
            e.printStackTrace();
            throw new CustomException("511",e.getMessage());
        }

    }

    public Claims verifyToken(String token){
        try {
            return Jwts.parser()
                    .verifyWith(getSecretKey())  //  根据密钥进行解密
                    .build()
                    .parseClaimsJws(token)  //  解析并获得Jws类型的Claims对象
                    .getBody();
        }catch (JwtException e){
            throw new CustomException("511",e.getMessage());
        }
    }
}
