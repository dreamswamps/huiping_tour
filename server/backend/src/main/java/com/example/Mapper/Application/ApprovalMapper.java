package com.example.Mapper.Application;

import com.example.POJO.Application;
import org.apache.ibatis.annotations.Mapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface ApprovalMapper {
    List<Application> pendingApplication(String type, String apply_account, Integer aid, boolean is_DESC, int is_All);

    int lockApplication(Integer aid, Integer currentUserId, LocalDateTime now);

    int unlockApplication(Integer aid, Integer currentUserId);

    int resultApplication(Application application);

//    疑点报错，目前不影响运行
    Application checkWorkerId(Integer aid);

    void clearApplication(LocalDateTime deadline);

    Application selectByAid(Integer aid);
}
