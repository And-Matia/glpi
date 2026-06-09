package matia.glpicore.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusApplicationDTO {
    private Long id;
    private String name;
    private String malgacheName;
}
