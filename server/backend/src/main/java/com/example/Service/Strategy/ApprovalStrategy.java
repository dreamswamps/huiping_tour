package com.example.Service.Strategy;

import com.example.POJO.Application;
import com.example.Util.Result;

public interface ApprovalStrategy {
    /*
    审批流程策略模式统一约束接口
     */
    Result approve(Application application);
    Result reject(Application application);

    /*
    申请流程策略模式统一约束接口
    还债，但是底子够厚
     */
    Result apply(Application application);
}