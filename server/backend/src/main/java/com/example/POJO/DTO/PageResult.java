package com.example.POJO.DTO;

import com.github.pagehelper.PageInfo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PageResult<T> {
    private Long total;
    private Integer pageNum ;
    private Integer pageSize;
    private List<T> obj;

    public static <T> PageResult<T> of(Long total, Integer currentPage, Integer pageSize, List<T> obj) {
        return new PageResult<>(total, currentPage, pageSize, obj);
    }

    public static <T> PageResult<T> fromPageInfo(PageInfo<T> pageInfo) {
        return new PageResult<>(
                pageInfo.getTotal(),
                pageInfo.getPageNum(),
                pageInfo.getPageSize(),
                pageInfo.getList()
        );
    }

//    返回包含空的obj
    public static <T> PageResult<T> empty(Integer currentPage, Integer pageSize) {
        return new PageResult<>(0L, currentPage, pageSize, new ArrayList<>());
    }
}
