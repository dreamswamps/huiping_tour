package com.example.Service;

import com.example.Exception.CustomException;
import com.example.Mapper.AdminAuthMapper;
import com.example.Mapper.AdminMapper;
import com.example.POJO.Admin;
import com.example.POJO.AdminAuth;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {
    @Resource
    private AdminMapper adminMapper;
    @Resource
    private AdminAuthMapper adminAuthMapper;

//    用于通过id查询数据库判断该id是否具有管理员权限
    public void IDAuthManager(int id){
        AdminAuth adminAuth = adminAuthMapper.ExistByAdminId(id);
        if(adminAuth != null && adminAuth.getRole().equals("Admin")){
            return;
        }else {
            throw new CustomException("501","权限不足，拒绝访问");
        }
    }

    public List<Admin> SelectAll(Admin admin) {
        return adminMapper.SelectAll(admin);
    }

    public Admin SelectById(int id) {
        Admin admin = adminMapper.SelectById(id);
        if (admin != null) {
            return admin;
        }
        throw new CustomException("400","未能查询到数据");
    }

    public PageInfo<Admin> SelectPage(int pageNum, int pageSize, Admin admin) {
        PageHelper.startPage(pageNum, pageSize);
        List<Admin> list = adminMapper.SelectAll(admin);
        return PageInfo.of(list);
    }

    public void InsertAdmin(Admin admin) {
        if (admin.getId() == null) {
            throw new CustomException("400","需要有效的id");
        }
        if (admin.getGender() == null || admin.getGender().isEmpty()) {
            throw new CustomException("400","需要有效的性别");
        }

        Admin existingAdmin = adminMapper.SelectById(admin.getId());
//        能够根据id找到数据
        if (existingAdmin != null) {
//            该数据未被标记为软删除，判定为id有效
            if (existingAdmin.getIs_deleted() == 0){
                throw new CustomException("400", "抱歉，该id已被使用，请更换id");
            }
//            该数据标记为删除，对该id进行复用
            else {
                admin.setIs_deleted(0);
                if(adminMapper.UpdateById(admin) == 0){
                    throw new CustomException("401", "恢复数据失败");
                }
//                admin和admin_auth双表都已经被判定为软删除，开始对auth该id进行复用，重新赋予初始值
                HandleAdminAuth(admin.getId());
                return;
            }
        }
//        不在该id正常执行新增操作
        admin.setIs_deleted(0);
        if(adminMapper.InsertAdmin(admin) == 0){
            throw new CustomException("401","新增失败，未能新增数据");
        }
        HandleAdminAuth(admin.getId());
    }

    public void Undo(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new CustomException("400", "需要有效的ID列表");
        }
        if(adminMapper.UndoByIds(ids) == 0){
            throw new CustomException("401", "撤回失败，未找到需要撤回的数据");
        }
        adminAuthMapper.UndoByAdminIds(ids);
    }

    public void UpdateById(Admin admin) {
        if (admin.getId() == null) {
            throw new CustomException("400","需要有效的id");
        }
        Admin existing = adminMapper.SelectById(admin.getId());
        if (existing == null || existing.getIs_deleted() == 1) {
            throw new CustomException("404", "要更新的数据不存在或已被删除");
        }
        if(adminMapper.UpdateById(admin) == 0){
            throw new CustomException("401","更新失败，未能找到需要更新的数据");
        }
    }

    public void DeleteById(Integer id) {
        if (id == null) {
            throw new CustomException("400","需要有效的id");
        }
        if(adminMapper.SoftDeleteById(id) == 0){
            throw new CustomException("401","更新失败，未能找到需要删除的数据");
        }
        adminAuthMapper.SoftDeleteByAdminId(id);
    }

    public void DeleteBatch(List<Integer> ids) {
        adminMapper.SoftDeleteByIds(ids);
        adminAuthMapper.SoftDeleteByAdminIds(ids);
    }

//    处理复用admin的认证信息
    private void HandleAdminAuth(Integer id) {
        if (id == null){
            return;
        }
        adminAuthMapper.DeleteByAdminId(id);
        CreateDefaultAdminAuth(id);
    }

//    创建默认的用户认证信息
    private void CreateDefaultAdminAuth(Integer id) {
        AdminAuth adminAuth = new AdminAuth();
        adminAuth.setAdmin_id(id);
        adminAuth.setUsername("User_"+id);
        adminAuth.setPwd("123456");
        adminAuth.setEmail("");
        adminAuth.setRole("User");
        adminAuth.setIs_deleted(0);
        if(adminAuthMapper.insert(adminAuth) == 0){
            throw new CustomException("401", "创建认证信息失败");
        }
    }

    public Admin GetPersonalInfo(int id) {
        Admin admin = adminMapper.GetPersonalInfo(id);
        if (admin != null) {
            return admin;
        }else {
            throw new CustomException("401","账号信息异常");
        }
    }

    public void InsertAdminList(List<Admin> adminList) {
        adminMapper.InsertAdminList(adminList);
        for (Admin admin : adminList) {
            Integer id = admin.getId();
            HandleAdminAuth(id);
        }
    }

    public Map<String,Object> GenderNumberSelect() {
        List<Admin> adminList = adminMapper.SelectAll(null);
//        将所有用户信息转为流->获取性别属性->筛选非空数据->收集转为Set数据(自动完成去重)
        Set<String> genderNameList = adminList.stream().map(Admin::getGender).filter(Objects::nonNull).collect(Collectors.toSet());
//        System.out.println(genderNameList);

        List<Integer> genderCountList = new ArrayList<>();

//        Math.toIntExact转为Integer(原本为Long)
//        转为流->筛选对应性别的人数->计数
        for (String gender : genderNameList) {
            genderCountList.add(Math.toIntExact(adminList.stream().filter(admin -> gender.equals(admin.getGender())).count()));
        }

//        将名称和数量分离，不需要前端进一步分离数据，可以直接提供给Echarts使用
        Map<String,Object> result = new HashMap<>();
        result.put("genderNameList",genderNameList);
        result.put("genderCountList",genderCountList);
        return result;
    }

    public String NewName(int id) {
        return adminMapper.NewName(id);
    }
}
