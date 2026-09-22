package com.example.Service.Strategy;

import com.example.Mapper.Application.ApplyMapper;
import com.example.Mapper.Application.ApprovalMapper;
import com.example.Mapper.Application.UnifiedApplyMapper;
import com.example.POJO.Application;
import com.example.Service.UtilService;
import com.example.Util.Result;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Map;

@Component
public class DisableTemplateStrategy implements ApprovalStrategy{

    @Resource
    private ApplyMapper applyMapper;

    @Resource
    private ApprovalMapper approvalMapper;

    @Resource
    private UnifiedApplyMapper unifiedApplyMapper;

    @Resource
    private UtilService utilService;

    /*
    停用模板审批
    通过则将unified_apply_template表中指定模板的disabled修改为1
    其中apply_data中会保存名为name的参数，其指向了模板简称templateName
     */
    @Override
    public Result approve(Application application) {
        Object applyData = application.getApply_data();
//        Map<String, Object> formData = application.getFormData();
//        String reason = formData.get("reason").toString();
        application.setApproved_time(new Date());
        application.setHas_completed(1);
        application.setWorking(0);
//        application.setReason(reason == null || reason.trim().isEmpty()?"未知原因":reason);
        try {
            Map<String, Object> dataMap = null;

            // 处理不同类型的数据
            if (applyData instanceof Map) {
                dataMap = (Map<String, Object>) applyData;
            } else if (applyData instanceof String) {
                // 如果是字符串，解析为 Map
                ObjectMapper objectMapper = new ObjectMapper();
                dataMap = objectMapper.readValue((String) applyData,
                        new TypeReference<Map<String, Object>>() {});
            } else {
                return Result.error("500", "异常的申请信息类型: " +
                        (applyData != null ? applyData.getClass().getName() : "null"));
            }

            // 处理业务逻辑
            if (dataMap.containsKey("name") && dataMap.get("name") != null) {
                application.setApproval(1);
                try {
                    unifiedApplyMapper.changeTemplateDisabledByName(dataMap.get("name").toString(), 1);
                    approvalMapper.resultApplication(application);
                    return Result.success("审批已更新");
                } catch (Exception e) {
                    e.printStackTrace();
                    return Result.error(e.getMessage());
                }
            } else {
                return Result.error("400", "申请数据缺少name字段");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("500", "解析申请数据失败: " + e.getMessage());
        }
    }

    /*
    不需要额外的操作，只拒绝申请
     */
    @Override
    public Result reject(Application application) {
//        Map<String, Object> formData = application.getFormData();
//        String reason = formData.get("reason").toString();
        application.setApproved_time(new Date());
        application.setHas_completed(1);
        application.setWorking(0);
//        application.setReason(reason == null || reason.trim().isEmpty()?"未知原因":reason);
        application.setApproval(2);
        approvalMapper.resultApplication(application);
        return Result.success("审批已更新");
    }

    /*
    提交停用模板申请
    需要添加字段并设置type, apply_account和apply_data
    ⚠apply_data中如果带有captcha，则表示为管理员的快速申请，那么在完成申请后，直接进行通过操作
     */
    @Override
    public Result apply(Application application) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            String json = objectMapper.writeValueAsString(application.getApply_data());
            application.setJson(json);
            applyMapper.submitApplicationStrategy(application);

            // 管理员特殊操作 - 检查captcha
            Object applyData = application.getApply_data();
            if (applyData instanceof Map<?, ?> dataMap) {
                if (dataMap.containsKey("token") && dataMap.get("token") != null) {
                    if (utilService.verifyToken((String) dataMap.get("token"))) {
                        return approve(application);
                    }
                    else return Result.success("申请成功，但是管理员快速操作失败");
                }
            }
            return Result.success("申请成功！", application);
        }catch (Exception e){
            e.printStackTrace();
            return Result.error("申请流程异常，申请失败");
        }
    }
}
