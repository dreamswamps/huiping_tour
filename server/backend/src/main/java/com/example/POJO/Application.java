package com.example.POJO;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Application {
    private Integer aid;
    private String type;
    private String apply_account;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss",timezone = "GMT+8")
    private Date apply_time;
    private Integer approval;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss",timezone = "GMT+8")
    private Date approved_time;
    private Integer has_completed;
    private Integer working;
    private Integer worker;
    private String worker_name;
    private String reason;
//    新增用户名和邮箱
    private String user_name;
    private String user_email;
//    新增的用于接收审批表单信息
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Map<String, Object> formData;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Object apply_data;

//    JSON数据存储进数据库时的中转站
    private String json;
}