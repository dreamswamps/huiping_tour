package com.example.Service.Email;

import com.example.Exception.CustomException;
import com.example.POJO.Application;
import com.example.Util.ValidateCode.EmailHandlerConfig;
import com.example.Util.ValidateCode.EmailHandlerCreator;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.text.SimpleDateFormat;

@Service
public class EmailNotificationService {
    @Resource
    private EmailHandlerCreator emailHandlerCreator;

    @Resource
    private TemplateEngine templateEngine;

    SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    /**
     * 发送通用审批结果邮件
     */
    public void sendApprovalNotification(Application application) {
        try {
//            构建邮件html
            String htmlContent = buildApprovalNotificationHtml(application);
            EmailHandlerConfig emailHandlerConfig = new EmailHandlerConfig();
            emailHandlerConfig.setTo(application.getUser_email());
            emailHandlerConfig.setSubject("申请完成通知");
            emailHandlerConfig.setContent(htmlContent);
            emailHandlerConfig.setHtml(true);
            emailHandlerCreator.sendEmail(emailHandlerConfig);
        } catch (Exception e){
            e.printStackTrace();
            throw new CustomException("500", "邮件发送异常");
        }
    }

    /**
     *  构建通用审批通知HTML内容
     */
    private String buildApprovalNotificationHtml(Application application) {
        Context context = new Context();
//        基础变量
        context.setVariable("application_type", translateType(application.getType()));
        context.setVariable("application_id", application.getAid());
        context.setVariable("apply_account", application.getApply_account());
        context.setVariable("user_name", application.getUser_name());
        context.setVariable("apply_time", SDF.format(application.getApply_time()));
        context.setVariable("approved_time", SDF.format(application.getApproved_time()));
        context.setVariable("worker_name", application.getWorker_name());
        context.setVariable("approval", application.getApproval());
        context.setVariable("current_year", java.time.Year.now().getValue());

//        特殊变量
        if ("pwd-reset".equals(application.getType())) {
            context.setVariable("reset_method", application.getFormData().get("reset_method"));
//            当method=0/1时，设置新密码
            if ("1".equals(application.getFormData().get("reset_method"))) {
                context.setVariable("new_pwd", application.getFormData().get("sim_data"));
            }
            if ("0".equals(application.getFormData().get("reset_method"))) {
                context.setVariable("new_pwd", "123456");
            }
        }

//        拒绝申请
        if (!"1".equals(application.getType())) {
            context.setVariable("reason", application.getReason());
        }
        return templateEngine.process("ApprovalNotificationTemplate", context);
    }



    /**
     * 对type进行翻译
     */
    private String translateType(String type) {
        switch (type) {
            case "pwd-reset":
                return "重置密码";
            default:
                return "申请";
        }
    }
}
