package com.example.Service.Application;

import com.example.Exception.CustomException;
import com.example.POJO.Application;
import com.example.Service.Strategy.ApplyStrategyMap;
import com.example.Service.Strategy.ApprovalStrategy;
import com.example.Util.Result;
import jakarta.annotation.Resource;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

@Service
public class ApprovalMapService {

    /*
    该Service是用于搭配ApplyService的审批流程
    提供一个根据type指向不同业务层逻辑的中间层
    需要:类型type，审批状态approval
    传递Application类
     */
    @Resource
    private ApplyStrategyMap applyStrategyMap;
    @Resource
    private ApplicationContext applicationContext;

    /*
    审批入口方法
    需要传入完整的申请对象
     */
    public Result dispatch(Application application) {
//        从.yml中获取到当前申请type对应的值
        ApprovalStrategy strategy = getStrategyBeanName(application);
        if (application.getApproval() == 1){
            return strategy.approve(application);
        }else {
            return strategy.reject(application);
        }
    }

    /*
    申请入口方法
    还债
     */
    public Result apply(Application application) {
        ApprovalStrategy strategy = getStrategyBeanName(application);
        return strategy.apply(application);
    }

    private ApprovalStrategy getStrategyBeanName(Application application) {
        try {
            String strategyClassName = applyStrategyMap.getMap().get(application.getType());
            if (strategyClassName == null) {
                throw new CustomException("511","未知的审批类型："+application.getType());
            }
            String strategyBeanName = strategyClassName.substring(0,1).toLowerCase()+strategyClassName.substring(1);
            return applicationContext.getBean(strategyBeanName, ApprovalStrategy.class);
        } catch (Exception e) {
            e.printStackTrace();
            throw new CustomException("500", e.getMessage());
        }
    }
}
