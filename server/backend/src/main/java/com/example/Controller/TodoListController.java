package com.example.Controller;

import com.example.POJO.TodoList;
import com.example.Service.TodoListService;
import com.example.Util.Result;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/todo")
public class TodoListController {
    @Resource
    private TodoListService todoListService;

    @GetMapping("/selecttodolistbyid")
    public Result selectTodoListById(@RequestHeader("X-Current-User-ID") Integer currentUserId) {
        return Result.success(todoListService.selectTodoListById(currentUserId));
    }

    @PostMapping("/inserttodolist")
    public Result insertTodoList(@RequestBody TodoList todoList,
                                 @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        todoList.setUid(currentUserId);
        todoListService.insertTodoList(todoList);
        return Result.success("待办事务添加成功");
    }

    @PutMapping("/updatetodolist")
    public Result updateTodoList(@RequestBody TodoList todoList,
                                 @RequestHeader("X-Current-User-ID") Integer currentUserId){
        todoListService.checkUid(todoList.getUid(),currentUserId);
        todoListService.updateTodoList(todoList);
        return Result.success("待办事务更新成功");
    }

    @DeleteMapping("/harddeletetodolist/{id}")
    public Result hardDeleteTodoList(@PathVariable Integer id,
                                     @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        todoListService.hardDeleteTodoList(id, currentUserId);
        return Result.success("待办事务删除成功");
    }

    @PutMapping("/saveindex")
    public Result saveIndex(@RequestBody List<TodoList> todoLists,
                            @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        todoListService.checkUid(todoLists.get(0).getUid(),currentUserId);
        todoListService.saveIndex(todoLists);
        return Result.success("保存成功");
    }

    /*
    前端需要提供特定的tag名称，定位修改的tag名称
     */
    @PutMapping("/tagtoggle/{id}")
    public Result tagToggle(@PathVariable Integer id,
                          @RequestParam String tag){
        todoListService.tagToggle(id,tag);
        return Result.success("Change has come to our todolist...");
    }

}
