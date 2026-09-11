package com.example.Service.Application;

import com.example.Mapper.Application.UnifiedApplyRenderMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UnifiedApplyRenderService {

    @Resource
    private UnifiedApplyRenderMapper unifiedApplyRenderMapper;

    public List<String> renderTypeList() {
        return unifiedApplyRenderMapper.renderTypeList();
    }

    public List<String> getRenderDialogData() {
        return unifiedApplyRenderMapper.getRenderDialogData();
    }

    public List<Map<String, Object>> getRenderDialogDataKeyList(String type) {
        return unifiedApplyRenderMapper.getRenderDialogDataKeyList(type);
    }

    public List<Map<String, Object>> getDialogRenderByDataKeyList(List<String> keyList) {
        List<Map<String, Object>> resultList = unifiedApplyRenderMapper.getDialogRenderByDataKeyList(keyList);
        List<Map<String, Object>> result = new ArrayList<>();
        for (String key : keyList) {
            for (Map<String, Object> map : resultList) {
                if (map.get("field_key").equals(key)) {
                    result.add(map);
                }
            }
        }
        return result;
    }

    public List<Map<String, Object>> getRenderDialogDataSpValue(String type) {
        return unifiedApplyRenderMapper.getRenderDialogDataSpValue(type);
    }
}
