# madcampWeek3 - SpaceWar

# Outline

---

여러 플레이어들이 각자 조종할 무기를 선택하고, 적을 물리치며 살아남는 협동 게임입니다.

우주선 내부를 이동하며 조종석을 선택하면 해당 무기의 조종이 시작됩니다.

- 우주선을 움직이는 조종석
- 총을 움직이는 조종석
- 미사일을 움직이는 조종석
- 방어막을 움직이는 조종석

4가지의 조종석을 적절히 바꿔가며 살아남아 봅시다.

# Team

---

**김준협**

- KAIST 전기및전자공학부
- https://github.com/Junhyeop505
- kjun6800@gmail.com

**이정규**

- 한양대학교 컴퓨터소프트웨어학부 21
- https://github.com/ljg02
- gyu021211@gmail.com

# Tech Stack

---

**Front-end** : React

**Back-end** : Node.js

**IDE** : VSCode

**배포**: GCP

# Detail

---

### 구현

프론트엔드

- 사용자 입력(키보드, 마우스) 받기
    
    → 로컬 좌표계에서의 위치 이동 정보를 서버에 전달
    
- 서버에서 받아온 글로벌 좌표에 따라 현재 카메라 내에 담길 오브젝트들을 렌더링
- 모든 주체가 움직일 거리를 백엔드로 정보 전달

백엔드

- 클라이언트에서 위치 이동 정보 받기
- 모든 오브젝트(우주선, 플레이어, 적, 투사체 등)들의 글로벌 좌표를 계산하여 클라이언트들에게 전달

### 메인 화면

플레이어 이름과, 캐릭터 색깔을 선택할 수 있습니다.

조작키 설명 버튼을 누르면 조작키 설명 페이지로 넘어가고,

게임 시작 버튼을 누르면 선택한 이름과 색깔의 플레이어로 게임에 참가하게 됩니다.

![메인화면](https://github.com/user-attachments/assets/ba04da54-7f84-4f4e-a03b-423e1ad76759)


### 조작키 설명

게임에 사용되는 조작키를 확인할 수 있습니다.

![조작키](https://github.com/user-attachments/assets/15ae0d03-3e48-434e-8112-39eeca0cb6cf)


### 게임 화면

<img width="1919" height="967" alt="게임화면" src="https://github.com/user-attachments/assets/cebf76c2-2872-4c20-ba28-21dfb8bb04c4" />


여러 사용자들이 모여서 게임을 진행합니다. 

사용자들은 각자 우주선 안에서 자유롭게 움직이면서 우주선의 무기를 선택할 수 있습니다. 

위치에 따라 선택할 수 있는 무기가 다릅니다. 

해당 무기를 담당하는 방에 가서 Q를 누르게 되면 무기에 대한 권한이 주어지고, E를 누르면 다시 해제됩니다. 

우주선 바깥 일정 반경 내에 랜덤한 적이 서서히 스폰되며, 적들은 우주선을 향해 진동하며 다가옵니다.

우주선이 적에게 닿으면 hp가 감소하고, hp가 0이 되면 게임오버 됩니다. 

적에게 닿지 않도록 우주선을 움직이거나 무기로 적을 처치해야 합니다.

### 무기

- 총
    - 가장 기본적인 무기로 마우스에 따라 발사되는 방향이 변하며 몬스터에게 기본 데미지를 줍니다.
    
![총발사](https://github.com/user-attachments/assets/78c2bc02-3ffd-4358-b562-b8c6201116c7)


- 미사일
    - 미사일을 발사하여 몬스터를 맞히면 폭발하여 큰 광역 데미지를 줍니다.
    - 총보다 연사 속도와 탄속이 느려 신중하게 조준해야 합니다.
    
![미사일 발사](https://github.com/user-attachments/assets/ce266bce-79f8-4314-9f0c-9c200d52e46f)


- 방어막
    - 방어막으로 해당 방향의 몬스터를 튕겨낼 수 있습니다.
    
![방어막](https://github.com/user-attachments/assets/9ebecca0-e060-4192-9264-a53e92ab9ae6)


- 우주선 조종
    - 우주선을 조종하여 맵을 이동하고 몬스터를 피할 수 있습니다.
    
![우주선 움직임](https://github.com/user-attachments/assets/e9cca142-6863-4088-ad51-a0503e8d5618)


### 게임 오버

우주선 hp가 0이 되면 게임 오버 화면이 나타납니다.

달성한 점수를 확인할 수 있고, 다시 시작 버튼을 누르면 메인 화면으로 돌아갑니다.

![gameover](https://github.com/user-attachments/assets/91334611-019a-4940-9661-2ef9c26979e0)


### 멀티 플레이

친구들과 같이 게임을 할 수가 있습니다.

![play1](https://github.com/user-attachments/assets/48b21cea-7ce2-45b5-a175-20546d90405f)

![play2](https://github.com/user-attachments/assets/0d2c02cd-8a3f-48e2-a5a5-3bac832e5078)

![play3](https://github.com/user-attachments/assets/59af9ad6-ce91-4bee-9d90-8da61acdf500)

![play4](https://github.com/user-attachments/assets/3844c5f7-555e-4db6-961f-20bfb788ea35)

![play5](https://github.com/user-attachments/assets/d17820a2-a8f6-45d5-95d5-4fcb347754be)

