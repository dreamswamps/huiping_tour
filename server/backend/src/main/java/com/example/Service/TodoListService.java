package com.example.Service;

import com.example.Exception.CustomException;
import com.example.Mapper.TodoListMapper;
import com.example.POJO.TodoList;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TodoListService {
    @Resource
    private TodoListMapper todoListMapper;

    public void checkUid(Integer uid,Integer currentUserId) {
        if (uid.equals(currentUserId)) {
            return;
        }
        throw new CustomException("501","id异常，拒绝服务");
    }

    public List<TodoList> selectTodoListById(Integer currentUserId) {
        return todoListMapper.selectTodoListById(currentUserId);
    }

    public void insertTodoList(TodoList todoList) {
        int length = todoListMapper.selectTodoListById(todoList.getUid()).size();
        if (length > 6) {
            throw new CustomException("501","待办事务过多，别拖延了");
        }
        todoList.modifyTimeUpdate();
        todoListMapper.insertTodoList(todoList);
    }

    public void updateTodoList(TodoList todoList) {
        todoList.modifyTimeUpdate();
        todoListMapper.updateTodoList(todoList.getId());
    }

    public void hardDeleteTodoList(Integer id, Integer currentUserId) {
        int line = todoListMapper.hardDeleteTodoList(id, currentUserId);
        if (line == 0) {
            throw new CustomException("501","id异常，不给你烧");
        }
    }

    public void saveIndex(List<TodoList> todoLists) {
        if (todoLists == null || todoLists.isEmpty()) {
            throw new CustomException("501","数据无效，拒绝服务");
        }
        for (int i = 0; i < todoLists.size(); i++) {
            todoLists.get(i).setIndex(i);
        }
        todoListMapper.saveIndex(todoLists);
    }

    public void tagToggle(Integer id,String tag) {
//        出于tag本身数量的有限性，可以直接在校验tags中手动写出所有符合预期的tag类型。
        List<String> tags = Arrays.asList("Done","done","Like","like");
        if ( tag == null || !tags.contains(tag)) {
            throw new CustomException("501","标签"+tag+"异常，拒绝服务");
        }
        TodoList todoList = new TodoList();
        todoList.modifyTimeUpdate();
        todoListMapper.tagToggle(id,todoList.getModify_time(),tag);
    }
}
