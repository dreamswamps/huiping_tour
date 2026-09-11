package com.example.Controller.Application;

import com.example.Service.Application.UnifiedApplyRenderService;
import com.example.Util.Result;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/unified-apply/render")
public class UnifiedApplyRenderController {

    @Resource
    private UnifiedApplyRenderService unifiedApplyRenderService;

    /*
    由于申请模板搜索框固定为type和disabled，因此该部分可以
     */
    @GetMapping("/typelist")
    public Result renderTypeList(){
        return Result.success(unifiedApplyRenderService.renderTypeList());
    }

    @GetMapping("/dialog-data")
    public Result getRenderDialogData(){
        return Result.success(unifiedApplyRenderService.getRenderDialogData());
    }

    @GetMapping("/dialog-data/keyList/{type}")
    public Result getRenderDialogDataKeyList(@PathVariable String type){
        return Result.success(unifiedApplyRenderService.getRenderDialogDataKeyList(type));
    }

    /*
    提供包含field_key的List，并且返回这些的动态渲染数据
     */
    @PostMapping("/dialog-render-data/keyList")
    public Result getDialogRenderByDataKeyList(@RequestBody List<String> keyList){
        return Result.success(unifiedApplyRenderService.getDialogRenderByDataKeyList(keyList));
    }

    /*
    返回特殊type的可用值组合
     */
    @GetMapping("/dialog-render-data/spValue/{type}")
    public Result getRenderDialogDataSpValue(@PathVariable String type){
        return Result.success(unifiedApplyRenderService.getRenderDialogDataSpValue(type));
    }
}
