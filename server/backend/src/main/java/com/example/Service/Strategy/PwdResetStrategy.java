package com.example.Service.Strategy;

import com.example.Exception.CustomException;
import com.example.Mapper.AdminAuthMapper;
import com.example.Mapper.Application.ApplyMapper;
import com.example.Mapper.Application.ApprovalMapper;
import com.example.POJO.Application;
import com.example.Service.Email.EmailNotificationService;
import com.example.Util.Result;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Map;

@Component
public class PwdResetStrategy implements ApprovalStrategy{
    @Resource
    private AdminAuthMapper adminAuthMapper;
    @Resource
    private ApprovalMapper approvalMapper;
    @Resource
    private ApplyMapper applyMapper;
    @Resource
    private EmailNotificationService emailNotificationService;
    /*
    重置密码的封装策略逻辑
    同意：
        switch reset_method
            0->默认密码
            1->sim_data为目标密码
            2->发送密码更新邮件
    拒绝：
        将reason更新到数据库表的reason字段中
    邮件通知：
        send_email 1->发送审批完成邮件
     */
    @Override
    public Result approve(Application application) {
        String resultText = "";
        Map<String, Object> formData = application.getFormData();
        application.setApproved_time(new Date());
        application.setHas_completed(1);
        application.setWorking(0);
        try {
            switch (formData.get("reset_method").toString()) {
                case "0":
                    adminAuthMapper.ResetPwdByAccount("123456", application.getApply_account());
                    resultText += "- 默认重置密码操作完成\n";
                    break;
                case "1":
                    String simData = formData.get("sim_data").toString();
                    if (simData == null || simData.trim().isEmpty()) {
                        throw new CustomException("501","非法密码");
                    }
                    adminAuthMapper.ResetPwdByAccount(simData, application.getApply_account());
                    resultText += "- 手动重置密码操作完成\n";
                    break;
                case "2":
                    if (application.getUser_email().isEmpty()){
                        throw new CustomException("501","未找到用户邮箱，无法发送重置密码链接邮件！");
                    }
                    /***
                     * 该部分工作量疑似过大，需要
                     * 一份额外的邮件模板
                     * 一个专门用于重置密码的页面
                     * 需要管理链接时效性
                     */
                    resultText += "- 重置密码邮件已发送\n";
                    break;
                default:
                    throw new CustomException("501","非法重置方式");
            }
            System.out.println("--------------");
            System.out.println(formData.get("send_email"));
            System.out.println("--------------");
            if (formData.get("send_email").equals("1")) {
                if (application.getUser_email().isEmpty()){
                    resultText += "- 未找到有效邮箱\n";
                } else {
                    emailNotificationService.sendApprovalNotification(application);
                    resultText += "- 审批完成邮件发送成功\n";
                }
            } else {
                resultText += "- 不发送审批完成邮件\n";
            }
            approvalMapper.resultApplication(application);
            resultText += "- 申请已更新\n";
            return Result.success(resultText);
        }catch (Exception e){
            throw new CustomException("500","重置密码操作失败！");
        }
    }

    @Override
    public Result reject(Application application) {
        String resultText = "";
        Map<String, Object> formData = application.getFormData();
        String reason = formData.get("reason").toString();
        application.setApproved_time(new Date());
        application.setHas_completed(1);
        application.setWorking(0);
        application.setReason(reason == null || reason.trim().isEmpty()?"未知原因":reason);
        try {
            if (formData.get("send_email").equals("1")) {
                if (!application.getUser_email().isEmpty()){
                    emailNotificationService.sendApprovalNotification(application);
                    resultText += "- 审批完成邮件发送成功\n";
                } else resultText += "- 未找到有效邮箱\n";
            } else {
                resultText += "- 不发送审批完成邮件\n";
            }
            approvalMapper.resultApplication(application);
            resultText += "- 申请已更新\n";
            return Result.success(resultText);
        }catch (Exception e){
            throw new CustomException("500","审批状态异常!");
        }
    }

    /*
    提交重置密码申请
    需要添加字段并设置type, apply_account和apply_data
     */
    @Override
    public Result apply(Application application) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            String json = objectMapper.writeValueAsString(application.getApply_data());
            application.setJson(json);
            applyMapper.submitApplicationStrategy(application);
            return Result.success("申请成功！", application);
        }catch (Exception e){
            e.printStackTrace();
            return Result.error("申请流程异常，申请失败");
        }
    }
}
