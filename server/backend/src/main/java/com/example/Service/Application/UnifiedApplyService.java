package com.example.Service.Application;

import com.example.Exception.CustomException;
import com.example.Mapper.AdminAuthMapper;
import com.example.Mapper.Application.UnifiedApplyMapper;
import com.example.POJO.AdminAuth;
import com.example.POJO.DTO.PageResult;
import com.example.POJO.UnifiedApply;
import com.example.Util.Result;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UnifiedApplyService {

    @Resource
    private UnifiedApplyMapper unifiedApplyMapper;

    @Resource
    private AdminAuthMapper adminAuthMapper;

//    通过用户id判断其能够访问到申请模板权限层级
    public PageResult<UnifiedApply> filterTemplate(Integer currentUserId, String type, String disabled, int pageNum, int pageSize) {
        try {
            AdminAuth user = adminAuthMapper.ExistByAdminId(currentUserId);
            if (user == null) throw new CustomException("500", "用户信息异常!");
            int permission = switch (user.getRole()) {
                case "Admin" -> 2;
                case "User" -> 1;
                default -> 0;
            };
            PageHelper.startPage(pageNum, pageSize);
            List<UnifiedApply> templateList = unifiedApplyMapper.filterTemplate(permission, type, disabled);
            return PageResult.fromPageInfo(PageInfo.of(templateList));
        } catch (Exception e) {
            e.printStackTrace();
            return PageResult.empty(pageNum, pageSize);
        }
    }
}
