package com.example.Controller.Application;

import com.example.Service.Application.UnifiedApplyService;
import com.example.Util.Result;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/unified-apply")
public class UnifiedApplyController {

    @Resource
    private UnifiedApplyService unifiedApplyService;

    /*
    根据用户的id判断该用户所处的权限层级
    目前为User->1  Admin->2
    能返回所有permission不大于自身权限的模板
     */
    @GetMapping("/template")
    public Result filterTemplate(@RequestParam(required = false) String type,
                                 @RequestParam(required = false) String disabled,
                                 @RequestParam(defaultValue = "1") int pageNum,
                                 @RequestParam(defaultValue = "15") int pageSize,
                                 @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        return Result.success(unifiedApplyService.filterTemplate(currentUserId, type, disabled, pageNum, pageSize));
    }
}
