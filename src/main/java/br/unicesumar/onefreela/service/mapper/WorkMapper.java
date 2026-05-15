package br.unicesumar.onefreela.service.mapper;

import br.unicesumar.onefreela.dto.WorkRegisterDTO;
import br.unicesumar.onefreela.dto.WorkUpdateDTO;
import br.unicesumar.onefreela.entity.Work;
import org.springframework.stereotype.Component;

@Component
public class WorkMapper {

    public Work toWork(WorkRegisterDTO dto) {
        Work work = new Work();
        work.setTitle(dto.getTitle());
        work.setDescription(dto.getDescription());
        work.setCategory(dto.getCategory());
        work.setPrice(dto.getPrice());

        return work;
    }

    public void updateWork(Work work, WorkUpdateDTO dto) {
        work.setTitle(dto.getTitle());
        work.setDescription(dto.getDescription());
        work.setCategory(dto.getCategory());
        work.setPrice(dto.getPrice());
    }
}