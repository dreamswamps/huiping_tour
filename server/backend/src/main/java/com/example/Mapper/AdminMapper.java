package com.example.Mapper;


import com.example.POJO.Admin;
import org.apache.ibatis.annotations.MapKey;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Map;

@Mapper
public interface AdminMapper {
    List<Admin> SelectAll(Admin admin);

    @Select("SELECT name FROM admin WHERE id = #{id}")
    String GetNameById(int id);

    @Select("SELECT * FROM admin WHERE id = #{id}")
    Admin SelectById(int id);

    @Select("SELECT * FROM admin WHERE id = #{id} and is_deleted = 0")
    Admin ExistAdmin(int id);

    Integer InsertAdmin(Admin admin);

    Integer UpdateById(Admin admin);

//    软删除，修改is_deleted来判断是否被删除过
    @Update("UPDATE admin SET is_deleted = 1 WHERE id = #{id}") // 新增这行软删除
    Integer SoftDeleteById(Integer id);

    Integer UndoByIds(List<Integer> ids);

    Integer SoftDeleteByIds(List<Integer> ids);

    Admin GetPersonalInfo(int id);

    void InsertAdminList(List<Admin> adminList);

    @Select("SELECT COALESCE(name,'账号已注销') FROM admin WHERE id = #{id} and is_deleted = 0")
    String NewName(int id);

//    硬删除，该接口已经被弃用。
//    @Delete("DELETE FROM admin WHERE id = #{id}")
//    Integer DeleteById(Integer id);
}
