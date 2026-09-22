package com.example.Controller.Application;

import com.example.POJO.Application;
import com.example.Service.Application.ApplyService;
import com.example.Util.Result;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/application")
public class ApplyController {
    /*
    该Controller主要用于用户提交申请
     */
    @Resource
    private ApplyService applyService;

    /*
    用户提交申请
    需要包含申请类型type和申请账号apply_account
     */
    @PostMapping("/submit")
    public Result submitApplication(@RequestParam String type,
                                    @RequestParam String apply_account) {
        return applyService.submitApplication(type, apply_account);
    }

    /*
    新接口，还债来了
    需要额外传入一个applyData(JSON)其会作为表单数据保存于数据库
     */
    @PostMapping("/submit/strategy")
    public Result submitApplicationStrategy(@RequestBody Application application) {
        return applyService.submitApplicationStrategy(application.getType(), application.getApply_account(), application.getApply_data());
    }

    /*
    区别于传递type和apply_account,该接口直接传递Application类型的数据
     */
    /*
    允许用户查看指定账号的申请状态
     */
    @GetMapping("/check")
    public Result checkApplication(@RequestParam String apply_account,
                                   @RequestParam(required = false) String type,
                                   @RequestParam(required = false) boolean isID) {
        return Result.success(applyService.checkApplication(apply_account, type, isID));
    }
}
