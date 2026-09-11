package com.example.Util.ValidateCode;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Component
@ConfigurationProperties(prefix = "email.handler")
public class EmailHandlerConfig {
    private String name;    //  发送人名称
    private String form;    //  发送人邮箱
    private String to;      //  收件人邮箱
    private String subject; //  主题
    private String content; //  内容
    private Boolean html;   //  true:html false:text
}
