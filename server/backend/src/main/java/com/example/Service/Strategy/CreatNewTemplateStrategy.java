package com.example.Service.Strategy;

import com.example.Mapper.Application.ApplyMapper;
import com.example.Mapper.Application.ApprovalMapper;
import com.example.Mapper.Application.UnifiedApplyMapper;
import com.example.POJO.Application;
import com.example.POJO.UnifiedApply;
import com.example.Util.Result;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Component
public class CreatNewTemplateStrategy implements ApprovalStrategy{

    @Resource
    private ApplyMapper applyMapper;

    @Resource
    private ApprovalMapper approvalMapper;

    @Resource
    private UnifiedApplyMapper unifiedApplyMapper;

    /*
    同意添加
    在template_approval表添加apply_data中的数据，同时统一设置name为CustomTemplate
    在unified_apply_template表添加form_data中的数据，包含name和desc，同时type设置未custom-template
     */
    @Override
    public Result approve(Application application) {
        try {
            // 1. 解析申请数据
            Object applyData = application.getApply_data();
            Map<String, Object> dataMap = null;
            ObjectMapper objectMapper = new ObjectMapper();

            if (applyData instanceof Map) {
                dataMap = (Map<String, Object>) applyData;
            } else if (applyData instanceof String) {
                dataMap = objectMapper.readValue((String) applyData,
                        new TypeReference<Map<String, Object>>() {});
            } else {
                return Result.error("500", "异常的申请信息类型");
            }

            // 2. 验证必要字段
            Object baseKeysObj = dataMap.get("base_keys");
            Object relationKeysObj = dataMap.get("relation_keys");

            if (baseKeysObj == null || relationKeysObj == null) {
                return Result.error("400", "申请数据缺少必要字段");
            }

            // 3. 类型转换并手动转为JSON字符串
            List<String> baseKeys = (List<String>) baseKeysObj;
            List<String> relationKeys = (List<String>) relationKeysObj;

            String baseKeysJson = objectMapper.writeValueAsString(baseKeys);
            String relationKeysJson = objectMapper.writeValueAsString(relationKeys);

            // 4. 获取表单数据
            Map<String, Object> formData = (Map<String, Object>) application.getFormData();
            String templateName = (String) formData.get("templateName");
            String templateDesc = (String) formData.get("templateDesc");

            // 5. 执行插入 - 传入JSON字符串
            unifiedApplyMapper.createCustomApplyTemplate(templateName, templateDesc);
            Integer tid = unifiedApplyMapper.getNewTemplateId();
            unifiedApplyMapper.createCustomRenderTemplate(baseKeysJson, relationKeysJson, tid);

            // 6. 更新审批状态
            application.setApproval(1);
            approvalMapper.resultApplication(application);

            return Result.success("审批已更新");

        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("500", "处理失败: " + e.getMessage());
        }
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
