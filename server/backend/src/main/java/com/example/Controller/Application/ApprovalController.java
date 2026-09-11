package com.example.Controller.Application;

import com.example.POJO.Application;
import com.example.Service.AdminService;
import com.example.Service.Application.ApprovalService;
import com.example.Util.Result;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/approval")
public class ApprovalController {
    /*
    该Controller主要用于管理员审批申请
     */
    @Resource
    private ApprovalService approvalService;
    @Resource
    private AdminService adminService;

    /*
    管理员获取所有待处理申请，未经过分页处理
    需要提供管理员id
    可以提供模糊查询的类型type，精确查询的申请账号apply_account，和决定申请时间升序降序的is_DESC(1表示降序)
     */
    @GetMapping("/pending")
    public Result pendingApplication(@RequestParam(required = false) String type,
                                     @RequestParam(required = false) String apply_account,
                                     @RequestParam(required = false) Integer aid,
                                     @RequestParam(required = false, defaultValue = "false") boolean is_DESC,
                                     @RequestParam(required = false, defaultValue = "0") int is_All,
                                     @RequestParam(defaultValue = "1") int pageNum,
                                     @RequestParam(defaultValue = "15") int pageSize,
                                     @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        adminService.IDAuthManager(currentUserId);
        return Result.success(approvalService.pendingApplication(type, apply_account, aid, is_DESC, is_All, pageNum, pageSize));
    }

    /*
    锁定working编辑状态，返回true/false
    为了避免两个管理员同时审批同个申请导致的后者覆盖前者操作。
    可能没法根除这个问题
    需要提供申请的aid，同样需要保存管理员身份和审批时间
     */
    @PutMapping("/lock/{aid}")
    public Result lockApplication(@PathVariable Integer aid,
                                  @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        adminService.IDAuthManager(currentUserId);
        return Result.success(approvalService.lockApplication(aid, currentUserId));
    }

    /*
    解锁working
    搭配锁定。由于非常规完成审批，因此需要清空worker。
     */
    @PutMapping("/unlock/{aid}")
    public Result unlockApplication(@PathVariable Integer aid,
                                    @RequestHeader("X-Current-User-ID") Integer currentUserId,
                                    @RequestHeader("X-Lock-Token") String token) {
        adminService.IDAuthManager(currentUserId);
        return Result.success(approvalService.unlockApplication(aid, token, currentUserId));
    }

    /*
    管理员审批申请
    需要审批结果1->通过/other->拒绝
    {
        "aid":13,
        "approval":0,
        "type":"pwd-reset",
    }
    审批完毕后解锁working并设置完成时间
    更新：为了支持策略模式的可拓展性和针对性，现在该接口被升级为需要提供type类型
         同时，考虑到需要的数据量增多，修改为使用body直接传递类
     */
    @PutMapping("/result")
    public Result resultApplication(@RequestBody Application application,
                                    @RequestHeader("X-Current-User-ID") Integer currentUserId,
                                    @RequestHeader("X-Lock-Token") String token) {
        adminService.IDAuthManager(currentUserId);
        return approvalService.resultApplication(application, currentUserId, token);
    }

    /*
    清除所有状态异常的申请，释放working状态
    状态异常：仍处于working状态，但是距离审批时间已经过去了15min
     */
    @PutMapping("/clear")
    public Result clearApplication(@RequestHeader("X-Current-User-ID") Integer currentUserId) {
        adminService.IDAuthManager(currentUserId);
        approvalService.clearApplication();
        return Result.success("清理完毕");
    }

    /*
    心跳检测
    前端在审批界面组件渲染后的15分钟后，若仍未被卸载，则向后端发送一次心跳检测
    如果此时出现了仍在审批working = 1并且仍未审批结束is_completed这种管理员长时间不操作的情况,释放working资源
    所有heartbeat都需要前端刷新页面
    正常返回true->管理员操作异常->刷新/false->该数据已被释放/完成->刷新
     */
    @GetMapping("/heartbeat/{aid}")
    public Result heartbeat(@PathVariable Integer aid,
                            @RequestHeader("X-Current-User-ID") Integer currentUserId,
                            @RequestHeader("X-Lock-Token") String token) {
        adminService.IDAuthManager(currentUserId);
        return approvalService.heartbeat(aid, token, currentUserId);
    }

    /*
    短心跳检测
    有别于上述的heartbeat接口只可能被调用一次
    该接口会被反复调用
    用于重置保存于Redis中指定数据的有效时间
     */
    @GetMapping("/heartbeat/revive/{aid}")
    public Result heartbeatRevive(@PathVariable Integer aid,
                                  @RequestHeader("X-Current-User-ID") Integer currentUserId,
                                  @RequestHeader("X-Lock-Token") String token){
        return approvalService.heartbeatRevive(aid, token, currentUserId);
    }
}
