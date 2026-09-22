package org.huiping.server.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result<T> {
    private int code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        return new Result<>(200, null, data);   // 不默认 message，兼容旧结构
    }
    public static Result<Void> success() {
        return new Result<>(200, null, null);
    }
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(200, message, data);
    }
    public static Result<Void> error(int code, String message) {
        return new Result<>(code, message, null);
    }
    public static <T> Result<T> error(int code, String message, T data) {
        return new Result<>(code, message, data);
    }
}
