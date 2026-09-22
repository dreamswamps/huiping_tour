package com.example.Service;

import com.example.Exception.CustomException;
import com.example.Mapper.AdminAuthMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class RandomIntService {
    @Resource
    private AdminAuthMapper adminAuthMapper;

    public Integer RandomID() {
        Random random = new Random();
        int loop = 0;
        int maxLoop = 10;
        while (loop < maxLoop) {
//            生成六位随机数
            Integer randomId = 100000 + random.nextInt(900000);
            if (adminAuthMapper.SelectByAdminId(randomId) == null) {
                return randomId;
            }
            loop ++;
        }
        throw new CustomException("500","无法生成唯一用户ID，请稍后再试");
    }

}
