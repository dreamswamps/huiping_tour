package com.example.Controller;

import com.example.POJO.Admin;
import com.example.Service.AdminService;
import com.example.Util.Result;
import com.example.Util.ValidateCode.ValidateCodeCreator;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Resource
    private AdminService adminService;

    /*
    查询所有admin，允许模糊匹配
    http://localhost:8081/admin/selectall
     */
    @GetMapping("/selectall")
    public Result SelectAllAdmin(Admin admin) {
        List<Admin> adminList = adminService.SelectAll(admin);
        return Result.success(adminList);
    }
    /*
    Path查询
    http://localhost:8081/admin/selectbyid/111
     */
    @GetMapping("/selectbyid/{id}")
    public Result SelectById(@PathVariable int id) {
        Admin admin = adminService.SelectById(id);
        return Result.success(admin);
    }
    /*
    Param查询
    http://localhost:8081/admin/selectbyparam?id=111
     */
    @GetMapping("/selectbyparam")
    public Result SelectByParam(@RequestParam int id) {
        Admin admin = adminService.SelectById(id);
        return Result.success(admin);
    }

    /*
    分页查询，需要使用pagehelper插件
    pageNum:当前页 pageSize:每页大小
    http://localhost:8081/admin/selectpage
     */
    @GetMapping("/selectpage")
    public Result SelectPage(Admin admin,
                             @RequestParam(defaultValue = "1") int pageNum,
                             @RequestParam(defaultValue = "10") int pageSize,
                             @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        adminService.IDAuthManager(currentUserId);
        PageInfo<Admin> pageInfo = adminService.SelectPage(pageNum, pageSize,admin);
        return Result.success(pageInfo);
    }

    /*
    http://localhost:8081/admin/insert
    {
        "id":"1",
        "name":"lzj",
        "gender":"男"
    }
     */
    @PostMapping("/insert")
    public Result InsertAdmin(@RequestBody Admin admin,
                              @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        adminService.IDAuthManager(currentUserId);
        adminService.InsertAdmin(admin);
        return Result.success("新增成功");
    }
    /*
    批量撤回操作
    http://localhost:8081/admin/undo
     */
    @PostMapping("/undo")
    public Result Undo(@RequestBody List<Integer> ids) {
        adminService.Undo(ids);
        return Result.success("撤回成功");
    }

    /*
    http://localhost:8081/admin/updatebyid
    {
        "id":"1",
        "name":"lzd",
        "gender":"男",
        "phone":"114514"
    }
     */
    @PutMapping("/updatebyid")
    public Result UpdateById(@RequestBody Admin admin,
                             @RequestHeader("X-Current-User-ID") Integer currentUserId) {
//        如果当前账号和修改账号的id一样，表示正在修改个人信息，允许修改
        if (!Objects.equals(admin.getId(), currentUserId)) {
            adminService.IDAuthManager(currentUserId);
        }
        adminService.UpdateById(admin);
        return Result.success("更新成功");
    }

    /*
    http://localhost:8081/admin/deletebyid/1
     */
    @DeleteMapping("/deletebyid/{id}")
    public Result DeleteById(@PathVariable int id,
                             @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        adminService.IDAuthManager(currentUserId);
        adminService.DeleteById(id);
        return Result.success("删除成功");
    }

    /*
    批量删除操作
    http://localhost:8081/admin/deletebatch
     */
    @DeleteMapping("/deletebatch")
    public Result DeleteBatch(@RequestBody List<Integer> ids,
                              @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        adminService.IDAuthManager(currentUserId);
        adminService.DeleteBatch(ids);
        return Result.success("批量删除成功");
    }

    /*
    http://localhost:8081/admin/personal/1
    提供给用户查询个人信息的接口
     */
    @GetMapping("/personal/{id}")
    public Result Personal(@PathVariable int id) {
        return Result.success(adminService.GetPersonalInfo(id));
    }

    /*
    http://localhost:8081/admin/gendernumberselect
    查询所有用户信息，并且统计出性别人数
     */
    @GetMapping("/gendernumberselect")
    public Result GenderNumberSelect() {
        return Result.success(adminService.GenderNumberSelect());
    }

    /*
    根据id查询用户名
     */
    @GetMapping("/newname/{id}")
    public Result NewName(@PathVariable int id) {
        return Result.success(adminService.NewName(id));
    }

}
