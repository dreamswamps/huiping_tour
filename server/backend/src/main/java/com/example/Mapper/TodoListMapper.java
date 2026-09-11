package com.example.Mapper;

import com.example.POJO.TodoList;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Date;
import java.util.List;

@Mapper
public interface TodoListMapper {
    List<TodoList> selectTodoListById(@Param("uid") Integer currentUserId);

    void insertTodoList(TodoList todoList);

    void updateTodoList(Integer id);

    int hardDeleteTodoList(Integer id,@Param("uid") Integer currentUserId);

    void saveIndex(List<TodoList> list);

    void tagToggle(Integer id, Date modify_time, String tag);
}
