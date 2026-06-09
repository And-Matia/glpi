package matia.glpicore.presentation.request;

import lombok.Data;

@Data
public class CreateColorRequest {
    private String name;
    private String hexValue;
}
