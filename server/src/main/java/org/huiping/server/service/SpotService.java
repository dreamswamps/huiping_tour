package org.huiping.server.service;

import org.huiping.server.entity.Spot;
import org.huiping.server.mapper.SpotMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SpotService {
    private final SpotMapper spotMapper;
    public SpotService(SpotMapper spotMapper) { this.spotMapper = spotMapper; }
    public List<Spot> listSpots() { return spotMapper.selectAll(); }
}
