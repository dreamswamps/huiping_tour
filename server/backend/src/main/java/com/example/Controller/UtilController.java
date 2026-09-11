package com.example.Controller;

import com.example.Service.UtilService;
import com.example.Util.Result;
import com.example.Util.ValidateCode.EmailHandlerConfig;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/util")
public class UtilController {
    /*
    该controller专门用于单独的util功能接口
     */

    @Resource
    private UtilService utilService;

    /*
    返回验证码图片
     */
    @GetMapping("/generatecaptcha")
    public void generateCaptcha(HttpServletRequest request, HttpServletResponse response){
        utilService.generateValidateCode(request, response);
    }

    /*
    通过会话session校验验证码
     */
    @PostMapping("/verifycaptcha")
    public Result verifyCaptcha(HttpServletRequest request,
                                @RequestParam String code,
                                @RequestParam String type,
                                @RequestParam(required = false, defaultValue = "false") boolean needKeep) {
        return utilService.verifyCaptcha(request, code, type, needKeep);
    }

    /*
    自定义/默认的发送一个邮件
     */
    @PostMapping("/send-email")
    public Result sendEmail(@RequestBody EmailHandlerConfig config) {
        return utilService.sendEmail(config);
    }

    /*
    发送给指定邮箱一份带有验证码的html邮件
     */
    @PostMapping("/send-email-captcha")
    public Result sendEmailCaptcha(HttpServletRequest request, @RequestParam String to) {
        return utilService.sendEmailCaptcha(request, to);
    }
}
