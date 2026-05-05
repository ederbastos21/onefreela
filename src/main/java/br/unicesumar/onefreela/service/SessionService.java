package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.exception.ValidationException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class SessionService {
    private final RedisTemplate<String,String> redisTemplate;

     public SessionService (RedisTemplate<String, String> redisTemplate){
        this.redisTemplate = redisTemplate;
    }

    public String storeSession (Long id){
         try{
             String token = UUID.randomUUID().toString();
             String userId = id.toString();
             redisTemplate.opsForValue().set(token,userId,1, TimeUnit.MINUTES);
             return token;
         } catch (Exception e){
             System.out.println("erro: nao pode criar sessao no redis" + e);
             throw new RuntimeException("Erro ao criar sessão", e);
         }
    }

    public String getSession (String token){
         return redisTemplate.opsForValue().get(token);
    }

}
