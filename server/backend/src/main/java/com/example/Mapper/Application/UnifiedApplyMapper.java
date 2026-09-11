package com.example.Mapper.Application;

import com.example.POJO.UnifiedApply;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface UnifiedApplyMapper {

    List<UnifiedApply> filterTemplate(int permission, String type, String disabled);

    int changeTemplateDisabledByName(String templateName, int disabled);

    void createCustomRenderTemplate(String base_keys, String relation_keys, Integer tid);

    int createCustomApplyTemplate(String templateName, String templateDesc);

    Integer getNewTemplateId();
}
