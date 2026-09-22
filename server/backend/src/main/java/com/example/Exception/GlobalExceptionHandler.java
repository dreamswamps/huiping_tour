package com.example.Exception;

import com.example.Util.Result;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

@ControllerAdvice("com.example.Controller")
public class GlobalExceptionHandler {
    @ExceptionHandler(Exception.class)
    @ResponseBody
    public Result ErrorException(Exception e) {
        return Result.error(e.getMessage());
    }

    @ExceptionHandler(CustomException.class)
    @ResponseBody
    public Result CustomException(CustomException e) {
        return Result.error(e.getCode(),e.getMsg());
    }
}
