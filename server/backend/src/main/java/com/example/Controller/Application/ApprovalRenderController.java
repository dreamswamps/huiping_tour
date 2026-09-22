package com.example.Controller.Application;

import com.example.Service.Application.ApprovalRenderService;
import com.example.Util.Result;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/approval/render")
public class ApprovalRenderController {

    @Resource
    ApprovalRenderService approvalRenderService;

    @PostMapping("/search")
    public Result renderSearch(@RequestBody List<String> keyList){
        return Result.success(approvalRenderService.renderSearch(keyList));
    }

    /*
    * 返回用于下拉选择框的数据列表，仅包含需要展示的字段
    * */
    @GetMapping("/typelist")
    public Result renderTypeList(){
        return Result.success(approvalRenderService.renderTypeList());
    }

    /*
    通过指定的模板name来返回对应的渲染数据
     */
    @GetMapping("/templates/{templateName}")
    public Result renderTemplateByName(@PathVariable String templateName){
        return approvalRenderService.renderTemplate(templateName, false, false, null, null);
    }

    /*
    通过tid返回渲染数据
     */
    @GetMapping("/templates")
    public Result renderTemplateByTid(@RequestParam String tid){
        return approvalRenderService.renderTemplate(tid, true,false, null, null);
    }

    @PostMapping("/templates/keyList")
    public Result renderTemplateByKeyList(@RequestBody Map<String, List<String>> keysList){
        List<String> baseKeys = keysList.get("baseKeys");
        List<String> relationKeys = keysList.get("relationKeys");
        return approvalRenderService.renderTemplate(null, false,true, baseKeys, relationKeys);
    }
}
