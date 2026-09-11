package com.example.POJO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Admin {
    private Integer id;
    private String name;
    @JsonFormat(pattern = "yyyy-MM-dd",timezone = "GMT+8")
    private Date addtime;
    private String gender;
    private String phone;
    private Integer is_deleted;
    private String avatar;

    private String username;
    private String role;
    private String email;
}
