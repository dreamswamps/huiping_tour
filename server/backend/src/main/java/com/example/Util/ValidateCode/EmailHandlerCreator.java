package com.example.Util.ValidateCode;

import com.example.Util.Result;
import jakarta.annotation.Resource;
import jakarta.mail.internet.InternetAddress;
import org.springframework.beans.BeanUtils;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Random;

//@Component
@Controller
public class EmailHandlerCreator {
    /*
    =====邮箱助手=====
     */
    @Resource
    private JavaMailSender mailSender;
    @Resource
    private EmailHandlerConfig DefaultConfig;
    @Resource
    private TemplateEngine templateEngine;
    private static final char[] CHAR_POOL =
            "0123456789abcdefghjklmnprstuvwxyzABCDEFGHJKLMNPRSTUVWXYZ".toCharArray();
    private static String captcha_cache = null; //  用于保存验证码缓存
//    根据默认值修改空元素
    private EmailHandlerConfig reMakeConfig(EmailHandlerConfig config) {
        if (config == null) {
//            深拷贝
            EmailHandlerConfig defaultConfig = new EmailHandlerConfig();
            BeanUtils.copyProperties(DefaultConfig, defaultConfig);
            return defaultConfig;
        }
        EmailHandlerConfig remakeConfig = new EmailHandlerConfig();
        remakeConfig.setName(valueOrDefault(config.getName(), DefaultConfig.getName()));
        remakeConfig.setForm(valueOrDefault(config.getForm(), DefaultConfig.getForm()));
        remakeConfig.setTo(valueOrDefault(config.getTo(), DefaultConfig.getTo()));
        remakeConfig.setSubject(valueOrDefault(config.getSubject(), DefaultConfig.getSubject()));
        remakeConfig.setContent(valueOrDefault(config.getContent(), DefaultConfig.getContent()));
        remakeConfig.setHtml((config.getHtml() != null)? config.getHtml():DefaultConfig.getHtml());
        return remakeConfig;
    }
//    判断 = null,trim().isEmpty()
    private String valueOrDefault(String value, String default_value) {
        return (value != null && !value.trim().isEmpty()) ? value : default_value;
    }
//    随机六位验证码字符串，仅字母和数字，字符池去除特定字符
    private StringBuilder randomCaptcha(){
        return randomCaptcha(6);
    }
    private StringBuilder randomCaptcha(int number){
        char[] chars = CHAR_POOL;
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < number; i++) {
            code.append(chars[random.nextInt(chars.length)]);
        }
        return code;
    }
//    为邮箱验证html注入需要的值
    private String htmlThymeleafBuilder(StringBuilder captcha){
        Context context = new Context();
        context.setVariable("captcha", captcha);
        return templateEngine.process("EmailTemplate", context);
    }
//    邮箱验证模板，只需要目标邮箱
    private EmailHandlerConfig sendEmailCaptchaTemplate(String to){
        EmailHandlerConfig config = new EmailHandlerConfig();
        config.setName(DefaultConfig.getName());
        config.setForm(DefaultConfig.getForm());
        config.setTo(to);
        config.setSubject("邮箱验证");
        StringBuilder captcha = randomCaptcha(6);
        captcha_cache = captcha.toString();
        config.setContent(this.htmlThymeleafBuilder(captcha));
        config.setHtml(true);
        return config;
    }
//    邮件助手，完成邮件发送，需要提供完整的邮件数据
    private Result sendEmailHandler(EmailHandlerConfig config){
        try {
//            MIME邮件工具包-需要异常处理
            MimeMessageHelper messageHelper = new MimeMessageHelper(mailSender.createMimeMessage(),true);
//            拼接为name<form>
            messageHelper.setFrom(new InternetAddress(config.getName() + "<" + config.getForm() + ">"));
            messageHelper.setTo(config.getTo());
            messageHelper.setSubject(config.getSubject());
            messageHelper.setText(config.getContent(), config.getHtml());
            mailSender.send(messageHelper.getMimeMessage());
            return Result.success(captcha_cache);
        }catch (Exception e){
//            邮箱的异常抛出机制会覆盖掉CustomException
            return Result.error(e.getMessage());
        }finally {
            captcha_cache = null;
        }
    }

//    允许自定义的邮件内容
    public Result sendEmail(@RequestBody EmailHandlerConfig config_input) {
        EmailHandlerConfig config = reMakeConfig(config_input);
        return sendEmailHandler(config);
    }

//    发送邮箱验证码,必须也只需提供目标邮箱即可,需要返回指定的验证码，保存于会话中
//    受限于邮箱发送的异常处理存在的问题，那么将captcha保存于Result中
    public Result sendEmailCaptcha(@RequestParam String to) {
        EmailHandlerConfig config = sendEmailCaptchaTemplate(to);
        return sendEmailHandler(config);
    }

}
