package com.example.Service.Application;

import com.example.Mapper.Application.ApprovalRenderMapper;
import com.example.Util.Result;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;


@Service
public class ApprovalRenderService {

    @Resource
    private ApprovalRenderMapper approvalRenderMapper;

    public Map<String, Map<String,Object>> renderSearch(List<String> keyList) {
        List<Map<String,Object>> rawData = approvalRenderMapper.renderSearch(keyList);

        Map<String, Map<String,Object>> result = rawData.stream()
                .collect(Collectors.toMap(
                        item -> (String) item.get("name"),
                        item -> {
                            Map<String, Object> fieldMap = new HashMap<>();
                            fieldMap.put("type", item.get("type"));
                            fieldMap.put("label", item.get("label"));
                            fieldMap.put("placeholder", item.get("placeholder"));
                            String optionStr = (String) item.get("option");
                            try {
//                                将数据库返回的字符串转换为JSON
                                ObjectMapper mapper = new ObjectMapper();
                                Object optionObj = optionStr != null ? mapper.readValue(optionStr, Object.class) : new ArrayList<>();
                                fieldMap.put("option", optionObj);
                            } catch (Exception e) {
                                fieldMap.put("option", new ArrayList<>());
                            }
                            return fieldMap;
                        }
                ));

        return result;
    }

    public List<String> renderTypeList() {
        return approvalRenderMapper.renderTypeList();
    }

    /*
    该方法功能逻辑应被层层分级
     */
    public Result renderTemplate(String templateName, Boolean isTid, Boolean hasListString, List<String> baseKeys, List<String> relationKeys) {
//        根据模板名称返回模板数据
        Map<String, Object> templateMap = new HashMap<>();
        if (!hasListString) {
            if (isTid){
                templateMap = approvalRenderMapper.renderTemplateByTid(templateName);
            }else {
                templateMap = approvalRenderMapper.renderTemplateByName(templateName);
            }
            if (templateMap == null || templateMap.isEmpty()) {
                return Result.error("未查询到该模板");
            }
        }

        ObjectMapper objectMapper = new ObjectMapper();
        try {
//          解析模板JSON数据
            if (!hasListString) {
                baseKeys = objectMapper.readValue((String) templateMap.get("baseKeys"), new TypeReference<List<String>>() {});
                relationKeys = objectMapper.readValue((String) templateMap.get("relationKeys"), new TypeReference<List<String>>() {});
            }

//            对模板数据进行校验 1.长度相同  2.baseKeys是否存在相同数据
            if (baseKeys.size() != relationKeys.size()) {
                return Result.error(templateName+"模板数组长度不匹配，拒绝使用该模板");
            }
            if (baseKeys.size() != baseKeys.stream().distinct().count()) {
                return Result.error(templateName+"存在重复的组件渲染，拒绝使用该模板");
            }

//            记录哪些baseKey需要关联额外的数据查询
            Map<String, String> orderedMap = new HashMap<>();
            List<String> relationKeyList = new ArrayList<>();   //  保存有哪些数据需要进行额外的查表，避免每一个都查询的，直接减少查询量
            for (int i = 0; i < baseKeys.size(); i++) {
                String baseKey = baseKeys.get(i);
                String relationKey = relationKeys.get(i);
//                映射不为0的数据
                if (!"0".equals(relationKey)) {
                    orderedMap.put(baseKey, relationKey);
                    relationKeyList.add(relationKey);
                }
            }

//            从基础表和关联表查询数据
            Map<String, Map<String, Object>> baseFields = approvalRenderMapper.getBaseFields(baseKeys);
            Map<String, Map<String, Object>> relationFields = approvalRenderMapper.getRelationFields(relationKeyList);

//            完成数据获取，根据顺序索引构建返回数据，并将需要关联的数据进行拼接
            List<Object> resultList = new ArrayList<>();

            for (String key : baseKeys){
                Map<String, Object> baseField = baseFields.get(key);
//                数据清洗
                List<String> deleteKeyList = new ArrayList<>(Arrays.asList(
                        "field_key", "created", "id", "updated", "recent_updater"));
                baseField.put("key", baseField.remove("name"));
                for (String deleteKey : deleteKeyList){
                    baseField.remove(deleteKey);
                }

//                拼接关联数据
                if (orderedMap.containsKey(key)) {
//                    从映射关系Map获取基础key对应的关联key值
                    Map<String, Object> relationField = relationFields.get(orderedMap.get(key));
                    if (baseField != null && relationField != null) {
//                        检测二者type是否统一，如果有误则立刻报错
                        if (!baseField.get("type").equals(relationField.get("type"))) {
                            return Result.error(key+"关联数据type不匹配！拒绝使用该模板");
                        }
                        Object configObj = relationField.get("config");
                        if (configObj instanceof String) {
                            try {
                                Map<String, Object> configMap = objectMapper.readValue((String) configObj,
                                        new TypeReference<Map<String, Object>>() {});
                                baseField.putAll(configMap);
                            } catch (Exception e) {
//                                对于解析失败的保留原貌
                                baseField.put("config", configObj);
                            }
                        } else if (configObj instanceof Map) {
                            System.out.println("----configObj instanceof Map----");
//                            如果已经满足是Map则可以直接合并，暂未发现过
                            baseField.putAll((Map<String, Object>) configObj);
                        }
                    }
                }
                resultList.add(baseField);
            }

            return Result.success(resultList);
        }catch (Exception e){
            return Result.error(e.getMessage());
        }
    }
}
