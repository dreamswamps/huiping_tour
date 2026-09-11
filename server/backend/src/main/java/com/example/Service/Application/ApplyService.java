package com.example.Service.Application;

import com.example.Exception.CustomException;
import com.example.Mapper.AdminAuthMapper;
import com.example.Mapper.Application.ApplyMapper;
import com.example.POJO.AdminAuth;
import com.example.POJO.Application;
import com.example.Util.Result;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class ApplyService {

    @Resource
    private ApplyMapper applyMapper;
    @Resource
    private AdminAuthMapper adminAuthMapper;
    @Resource
    private ApprovalMapService approvalMapService;

//    用于检查提供的账号是否存在或者注销，避免恶意提交
    public boolean existAccount(String apply_account) {
        try {
            AdminAuth adminAuth = adminAuthMapper.SelectByUsername(apply_account);
            return adminAuth.getIs_deleted() != 1;
        }catch (Exception e){
            return false;
        }
    }

//    申请模板
    public Application applicationTemplate(String type, String apply_account, Object applyData) {
        Application application = new Application();
        application.setType(type);
        application.setApply_account(apply_account);
        application.setApply_data(applyData);
        application.setApply_time(new Date());
        return application;
    }

    public Result submitApplication(String type, String apply_account) {
        if (existAccount(apply_account)) {
            try {
                Application application = applicationTemplate(type, apply_account, null);
                applyMapper.submitApplication(application);
                return Result.success("申请成功！", application);
            }catch (Exception e){
                System.out.println(e.getMessage());
                return Result.error("申请流程异常，申请失败");
            }
        }else {
            return Result.error("该账号状态异常，拒绝服务。");
        }
    }

    /*
    新接口，用新字段applyData和策略模式完成申请拓展
     */
    public Result submitApplicationStrategy(String type, String applyAccount, Object applyData) {
        if (existAccount(applyAccount)) {
            Application application = applicationTemplate(type, applyAccount, applyData);
            return approvalMapService.apply(application);
        } else {
            AdminAuth applicationAdmin = adminAuthMapper.SelectByAdminId(Integer.valueOf(applyAccount));
            if (applicationAdmin == null || applicationAdmin.getUsername() == null) {
                return Result.error("该账号状态异常，拒绝服务。");
            }
            Application application = applicationTemplate(type, applicationAdmin.getUsername(), applyData);
            return approvalMapService.apply(application);
        }
    }

//    根据提供的账号，查看该账号的申请(type非必选)
    public List<Application> checkApplication(String apply_account, String type, boolean isID) {
        if (isID) {
            AdminAuth adminAuth = adminAuthMapper.SelectByAdminId(Integer.valueOf(apply_account));
            apply_account = adminAuth.getUsername();
        }
        List<Application> applications = applyMapper.checkApplication(apply_account, type);
        if (!applications.isEmpty()){
            return applications;
        }else {
            throw new CustomException("500","该账号未进行任何相关申请");
        }
    }


}
