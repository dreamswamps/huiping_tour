package com.example.Util;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

//全局跨域处理
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOriginPattern("*");   //  设置访问源地址  (凭证与addAllowedOrigin冲突)
        config.addAllowedHeader("*");   //  设置访问源请求头
        config.addAllowedMethod("*");   //  设置访问源请求方法
        config.setAllowCredentials(true);   //  设置允许传递凭证
        source.registerCorsConfiguration("/**", config);    //  统一配置跨域请求
        return new CorsFilter(source);
    }
}
