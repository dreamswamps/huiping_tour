package com.example.Service;

import com.example.Exception.CustomException;
import com.example.Mapper.AdminAuthMapper;
import com.example.Mapper.AdminMapper;
import com.example.POJO.Admin;
import com.example.POJO.AdminAuth;
import com.example.Util.JWTManager;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AdminAuthService {
    @Resource
    AdminAuthMapper adminAuthMapper;
    @Resource
    AdminMapper adminMapper;
    @Resource
    RandomIntService randomIntService;
    @Resource
    JWTManager jwtManager;

//    role转换
    private String convertRole(String role) {
        if (role == null) {
            return null;
        }
        return switch (role) {
            case "User" -> "用户";
            case "Admin" -> "管理员";
            default -> "访客";
        };
    }

    public String Login(AdminAuth adminAuth) {
        // 原有登录逻辑不变
        String username = adminAuth.getUsername();
        AdminAuth db_adminAuth = adminAuthMapper.SelectByUsername(username);
        if (db_adminAuth == null) {
            throw new CustomException("500", "账号不存在");
        }
        if (db_adminAuth.getIs_deleted() == 1) {
            throw new CustomException("500", "该账号已被注销");
        }
        String pwd = adminAuth.getPwd();
        if (!db_adminAuth.getPwd().equals(pwd)) {
            throw new CustomException("500", "账号或密码错误");
        }
        Integer id = db_adminAuth.getAdmin_id();
        Admin admin = adminMapper.SelectById(id);
        if (admin == null) {
            throw new CustomException("500", "该用户状态异常，不允许登录");
        }
        Admin admin_result = new Admin();
        admin_result.setRole(convertRole(db_adminAuth.getRole()));
        admin_result.setName(admin.getName());
        admin_result.setId(admin.getId());
        admin_result.setAvatar(admin.getAvatar());
        admin_result.setEmail((db_adminAuth.getEmail() == null)?"未知":db_adminAuth.getEmail());
        return generationToken(admin_result);
    }

    public void Register(AdminAuth adminAuth) {
        String username = adminAuth.getUsername();
        AdminAuth db_adminAuth = adminAuthMapper.SelectByUsername(username);
        Integer id = null;
        if (db_adminAuth != null) {
            if (db_adminAuth.getIs_deleted() == 1) {
                // 复用已删除的账号
                id = db_adminAuth.getAdmin_id();
                adminAuthMapper.DeleteByAdminId(id);
//                CreateNewAdminAuth(id, adminAuth);
            } else {
                throw new CustomException("500", "账号已存在");
            }
        } else {
            id = randomIntService.RandomID();
        }

        // 创建新账号
        CreateNewAdminRecord(id, adminAuth); // 创建 admin 表记录
        CreateNewAdminAuth(id, adminAuth);
        return;
    }

    // 创建认证信息
    private void CreateNewAdminAuth(Integer id, AdminAuth adminAuth) {
        adminAuth.setAdmin_id(id);
        adminAuth.setRole("User");
        adminAuth.setIs_deleted(0);
        adminAuth.setEmail("");
        if (adminAuthMapper.insert(adminAuth) == 0) {
            throw new CustomException("401", "创建认证信息失败");
        }
    }

    // 新增：创建 admin 表记录
    private void CreateNewAdminRecord(Integer id, AdminAuth adminAuth) {
        Admin admin = new Admin();
        admin.setId(id);
        admin.setName(adminAuth.getUsername());
        admin.setGender("未知");
        admin.setIs_deleted(0);

        if (adminMapper.InsertAdmin(admin) == 0) {
            throw new CustomException("401", "创建用户信息失败");
        }
    }

    public void ChangePWD(AdminAuth adminAuth) {
        AdminAuth exist = adminAuthMapper.SelectByUsername(adminAuth.getUsername());
        if (exist != null && !Objects.equals(exist.getAdmin_id(), adminAuth.getAdmin_id())) {
            throw new CustomException("401","该账号已被申请，请更换账号");
        }
        adminAuthMapper.ChangePWD(adminAuth);
    }

    public List<Map<String,Object>> RoleNumberSelect() {
        List<String> roleList = adminAuthMapper.SelectAllRole();
        Map<String,String> roleNameMap = new HashMap<>();
        roleNameMap.put("Admin","管理员");
        roleNameMap.put("User","用户");

//        返回的Map(中文权限名称,该权限用户数量)
        List<Map<String,Object>> resultlist = new ArrayList<>();

        for (String roleEng : roleNameMap.keySet()){
            Map<String,Object> result = new HashMap<>();
//            roleEng::equals == roleEng -> roleEng.equals(roleEng)
            result.put("name",roleNameMap.get(roleEng));
            result.put("value",roleList.stream().filter(roleEng::equals).count());
            resultlist.add(result);

        }

        return resultlist;
    }

    public String generationToken(Admin admin) {
        return jwtManager.generateToken(admin);
    }

    public Object verifyToken(String token) {
        return jwtManager.verifyToken(token);
    }

//    查询对应用户的邮箱是否和提供的邮箱相同
    public boolean emailVerify(String username, String email) {
        String check = adminAuthMapper.emailVerify(username);
        return email.equals(check);
    }

//    提供账号，修改密码
    public boolean emailResetPwd(String username, String pwd) {
        return adminAuthMapper.emailResetPwd(username, pwd) > 0;
    }
}