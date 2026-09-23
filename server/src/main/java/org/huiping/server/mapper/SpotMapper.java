package org.huiping.server.mapper;

import org.huiping.server.entity.Spot;

import java.util.List;

/** 景点查询 Mapper。 */
public interface SpotMapper {
    List<Spot> selectAll();
}
