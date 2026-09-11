package com.example.Service.Strategy;

import com.example.Mapper.Application.ApplyMapper;
import com.example.Mapper.Application.ApprovalMapper;
import com.example.POJO.Application;
import com.example.Util.Result;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Map;

@Component
public class CustomTemplateStrategy implements ApprovalStrategy {
    @Resource
    private ApplyMapper applyMapper;

    @Resource
    private ApprovalMapper approvalMapper;

    @Override
    public Result approve(Application application) {
        application.setApproval(1);
        Map<String, Object> formData = application.getFormData();
        String reason = formData.get("reason").toString();
        application.setApproved_time(new Date());
        application.setHas_completed(1);
        application.setWorking(0);
        application.setReason(reason == null || reason.trim().isEmpty()?"未知原因":reason);
        approvalMapper.resultApplication(application);
        return Result.success("审批已更新");
    }

    @Override
    public Result reject(Application application) {
        application.setApproval(2);
        Map<String, Object> formData = application.getFormData();
        String reason = formData.get("reason").toString();
        application.setApproved_time(new Date());
        application.setHas_completed(1);
        application.setWorking(0);
        application.setReason(reason == null || reason.trim().isEmpty()?"未知原因":reason);
        approvalMapper.resultApplication(application);
        return Result.success("审批已更新");
    }

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
