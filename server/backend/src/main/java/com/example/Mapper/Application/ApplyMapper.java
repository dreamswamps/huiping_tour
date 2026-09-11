package com.example.Mapper.Application;

import com.example.POJO.Application;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ApplyMapper {
    int submitApplication(Application application);

//    该方法未筛选
    List<Application> checkApplication(String apply_account, String type);

    int submitApplicationStrategy(Application application);
}
