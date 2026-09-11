package com.example.Mapper;

import com.example.POJO.AdminAuth;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface AdminAuthMapper {
    AdminAuth SelectByAdminId(Integer admin_id);

    @Select("SELECT * FROM admin_auth WHERE admin_id = #{admin_id} and is_deleted = 0")
    AdminAuth ExistByAdminId(Integer admin_id);

    Integer insert(AdminAuth adminAuth);

    Integer SoftDeleteByAdminId(Integer admin_id);

    Integer SoftDeleteByAdminIds(List<Integer> admin_ids);

    Integer UndoByAdminIds(List<Integer> admin_ids);

    Integer DeleteByAdminId(Integer admin_id);

    AdminAuth SelectByUsername(String username);

    void ChangePWD(AdminAuth adminAuth);

    @Select("SELECT role FROM admin_auth WHERE is_deleted = 0")
    List<String> SelectAllRole();

    @Select("SELECT email FROM admin_auth WHERE username = #{username} and is_deleted = 0")
    String emailVerify(String username);

    int emailResetPwd(String username, String pwd);

    void ResetPwdByAccount(String pwd, String apply_account);
}
