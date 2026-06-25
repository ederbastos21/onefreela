package br.unicesumar.onefreela.service.mapper;

import br.unicesumar.onefreela.dto.WorkAdditionalDTO;
import br.unicesumar.onefreela.dto.WorkRegisterDTO;
import br.unicesumar.onefreela.dto.WorkUpdateDTO;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.entity.WorkAdditional;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class WorkMapper {

    public Work toWork(WorkRegisterDTO dto) {
        Work work = new Work();
        work.setTitle(dto.getTitle());
        work.setDescription(dto.getDescription());
        work.setCategory(dto.getCategory());
        work.setPrice(dto.getPrice());
        addAdditionals(work, dto.getAdditionals());
        return work;
    }

    public void updateWork(Work work, WorkUpdateDTO dto) {
        work.setTitle(dto.getTitle());
        work.setDescription(dto.getDescription());
        work.setCategory(dto.getCategory());
        work.setPrice(dto.getPrice());
        work.clearAdditionals();
        addAdditionals(work, dto.getAdditionals());
    }

    private void addAdditionals(Work work, List<WorkAdditionalDTO> additionals) {
        if (additionals == null || additionals.isEmpty()) {
            return;
        }
        for (WorkAdditionalDTO additionalDTO : additionals) {
            WorkAdditional additional = new WorkAdditional();
            additional.setTitle(additionalDTO.getTitle());
            additional.setDescription(additionalDTO.getDescription());
            additional.setPrice(additionalDTO.getPrice());
            work.addAdditional(additional);
        }
    }
}