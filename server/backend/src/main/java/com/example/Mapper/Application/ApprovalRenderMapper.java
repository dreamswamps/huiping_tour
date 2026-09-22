package com.example.Mapper.Application;

import org.apache.ibatis.annotations.MapKey;

import java.util.List;
import java.util.Map;

public interface ApprovalRenderMapper {
//    @MapKey is required 报错现在可忽略，不影响运行
    List<Map<String,Object>> renderSearch(List<String> keyList);

    List<String> renderTypeList();

    Map<String, Object> renderTemplateByName(String templateName);

    @MapKey("field_key")
    Map<String, Map<String, Object>> getBaseFields(List<String> baseKeys);

    @MapKey("fieldKey")
    Map<String, Map<String, Object>> getRelationFields(List<String> relationKeys);

    Map<String, Object> renderTemplateByTid(String templateName);
}
