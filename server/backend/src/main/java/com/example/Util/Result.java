package com.example.Util;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Result {
    private String code;
    private String msg;
    private Object data;

    public static Result success() {
        Result result = new Result();
        result.setCode("200");
        result.setMsg("success");
        return result;
    }
    public static Result success(Object data) {
        Result result = success();
        result.setData(data);
        return result;
    }
    public static Result success(String msg,Object data) {
        Result result = success();
        result.setMsg(msg);
        result.setData(data);
        return result;
    }

    public static Result error(){
        Result result = new Result();
        result.setCode("500");
        result.setMsg("error");
        return result;
    }

    public static Result error(String msg) {
        Result result = error();
        result.setMsg(msg);
        return result;
    }

    public static Result error(String code, String msg) {
        Result result = error();
        result.setCode(code);
        result.setMsg(msg);
        return result;
    }
}
