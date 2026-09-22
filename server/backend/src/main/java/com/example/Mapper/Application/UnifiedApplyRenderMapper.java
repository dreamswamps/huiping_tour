package com.example.Mapper.Application;

import org.apache.ibatis.annotations.MapKey;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface UnifiedApplyRenderMapper {
    List<String> renderTypeList();

    List<String> getRenderDialogData();

    List<Map<String, Object>> getRenderDialogDataKeyList(String type);

    List<Map<String, Object>> getDialogRenderByDataKeyList(List<String> keyList);

    List<Map<String, Object>> getRenderDialogDataSpValue(String type);
}
