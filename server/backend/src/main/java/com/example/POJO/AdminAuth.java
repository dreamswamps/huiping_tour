package com.example.POJO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminAuth {
    private String username;
    private String pwd;
    private String role;
    private Integer is_deleted;
    private String email;

    private Integer admin_id;
}
