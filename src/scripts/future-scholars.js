const App = (() => {
        let radarChartInstance = null;

        const resourceData = {
            coursera: {
                title: 'Coursera 专业证书',
                content: `<div class="resource-section"><img src="https://images.unsplash.com/photo-1620712943543-2858200f7426?q=80&w=800&auto=format&fit=crop" alt="人工智能概念的图片"><div class="text-content"><h3>对接世界名校在线课程</h3><p class="text-gray-600 dark:text-gray-400">我们为您筛选并推荐来自Google、IBM、斯坦福等顶尖企业和大学的在线证书课程，提前修读专业知识，提升学术竞争力，并可写入LinkedIn档案，获得全球认可。</p></div></div><div class="resource-section"><img src="https://images.unsplash.com/photo-1611926653458-092a4234cf55?q=80&w=800&auto=format&fit=crop" alt="专业人士档案页面的图片"><div class="text-content"><h3>提升职业竞争力</h3><p class="text-gray-600 dark:text-gray-400">获得的证书可以直接关联到您的LinkedIn个人资料，向全球的招生官和雇主展示您的专业技能和学习热情。热门证书如吴恩达的《AI For Everyone》、Google的《数据分析专业证书》等，都是申请相关专业时的有力加分项。</p></div></div>`
            },
            software: { 
                title: '软件著作权', 
                content: `<div class="resource-section"><img src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=800&auto=format&fit=crop" alt="开发者在编写代码"><div class="text-content"><h3>技术创新能力的体现</h3><p class="text-gray-600 dark:text-gray-400">对于申请计算机、数据科学等技术类专业的学生，一份软件著作权是证明你具备独立开发能力和创新思维的硬核材料。我们将指导你完成一个与申请方向相关的小项目，并协助完成软著的申请全流程。</p></div></div><div class="resource-section"><img src="https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=800&auto=format&fit=crop" alt="证书和文件的图片"><div class="text-content"><h3>官方认证，永久有效</h3><p class="text-gray-600 dark:text-gray-400">软件著作权由国家版权局认证，是受法律保护的知识产权。它不仅是你申请时的亮点，更是你未来职业生涯中的宝贵资产。</p></div></div>`
            },
            monograph: { 
                title: '英文专著发表', 
                content: `<div class="resource-section"><img src="https://images.unsplash.com/photo-1491841550275-5b462bf975db?q=80&w=800&auto=format&fit=crop" alt="一本打开的厚书"><div class="text-content"><h3>学术深度的终极证明</h3><p class="text-gray-600 dark:text-gray-400">参与发表一本英文专著（担任其中一个章节的作者），是向顶尖名校展示你学术研究能力的最佳方式。尤其适合申请研究型硕士或博士的学生。我们与海外出版社合作，提供正规的出版渠道。</p></div></div><div class="resource-section"><img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop" alt="学术研究团队在讨论"><div class="text-content"><h3>全程导师指导</h3><p class="text-gray-600 dark:text-gray-400">你将在专业导师的指导下，完成选题、文献综述、研究和写作过程。这不仅是一次背景提升，更是一次宝贵的学术训练经历。</p></div></div>`
            },
            internship: { 
                title: '名企实习与推荐信', 
                content: `<div class="resource-section"><img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop" alt="商务人士在会议中握手"><div class="text-content"><h3>链接行业顶尖资源</h3><p class="text-gray-600 dark:text-gray-400">我们将利用我们的合作网络，为你推荐在知名企业（如咨询、投行、科技公司等）的实习机会。一段高质量的实习经历能极大丰富你的简历，让你提前了解行业运作。</p></div></div><div class="resource-section"><img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop" alt="一封专业的推荐信"><div class="text-content"><h3>获得高含金量推荐信</h3><p class="text-gray-600 dark:text-gray-400">实习结束后，表现优异者将有机会获得由实习导师或公司高管出具的推荐信。这封来自业界的推荐信，将从不同角度印证你的能力和潜力，是申请商科、金融等实践性专业的重要加分项。</p></div></div>`
            }
        };

        const _initRadarChart = () => {
            const ctx = document.getElementById('radarChart');
            if (!ctx) return;

            const isDark = document.documentElement.classList.contains('dark');
            const gridColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
            const angleLineColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
            const pointLabelColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';

            const data = {
                labels: ['学术成绩', '研究经历', '语言能力', '课外活动', '领导力'],
                datasets: [{
                    label: '当前能力',
                    data: [75, 50, 85, 60, 40],
                    fill: true,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgb(59, 130, 246)',
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(59, 130, 246)'
                }, {
                    label: '目标要求',
                    data: [90, 70, 95, 80, 75],
                    fill: true,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(255, 99, 132)'
                }]
            };

            if (radarChartInstance) {
                radarChartInstance.destroy();
            }

            radarChartInstance = new Chart(ctx, {
                type: 'radar',
                data: data,
                options: {
                    elements: {
                        line: {
                            borderWidth: 2
                        }
                    },
                    scales: {
                        r: {
                            angleLines: { color: angleLineColor },
                            grid: { color: gridColor },
                            pointLabels: { color: pointLabelColor, font: { size: 12 } },
                            ticks: {
                                color: pointLabelColor,
                                backdropColor: 'transparent'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: pointLabelColor
                            }
                        }
                    }
                }
            });
        };

        const openModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            
            const backdrop = modal.querySelector('.modal-backdrop');
            const content = modal.querySelector('.modal-content');

            modal.style.display = 'flex';
            setTimeout(() => {
                if (backdrop) backdrop.style.opacity = 1;
                if (content) {
                    content.style.opacity = 1;
                    content.style.transform = 'scale(1)';
                }
            }, 10);

            if (modalId === 'planningModal') {
                _initRadarChart();
            }
        };

        const closeModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (!modal) return;

            const backdrop = modal.querySelector('.modal-backdrop');
            const content = modal.querySelector('.modal-content');

            if (backdrop) backdrop.style.opacity = 0;
            if (content) {
                content.style.opacity = 0;
                content.style.transform = 'scale(0.95)';
            }
            
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        };

        const openResourceModal = (resourceId) => {
            const data = resourceData[resourceId];
            if (!data) return;

            document.getElementById('resourceTitle').innerText = data.title;
            document.getElementById('resourceContent').innerHTML = data.content;
            openModal('resourceModal');
        };

        // Dark mode listener for chart redraw
        const themeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const modal = document.getElementById('planningModal');
                if (modal && mutation.attributeName === "class" && modal.style.display === 'flex') {
                    _initRadarChart();
                }
            });
        });
        
        document.addEventListener('DOMContentLoaded', () => {
             themeObserver.observe(document.documentElement, { attributes: true });
        });

        return { openModal, closeModal, openResourceModal };
    })();

    document.addEventListener('DOMContentLoaded', () => {
        // --- Dark Mode Auto-Toggle ---
        const applyTheme = (isDark) => {
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        const matcher = window.matchMedia('(prefers-color-scheme: dark)');
        applyTheme(matcher.matches);
        matcher.addEventListener('change', e => applyTheme(e.matches));
        
        // --- Scroll Reveal Animation ---
        const revealElements = document.querySelectorAll('.reveal');
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                }
            });
        }, {
            threshold: 0.1
        });

        revealElements.forEach(el => {
            scrollObserver.observe(el);
        });

        // --- Calculator Logic ---
        const calculator = {
            // Elements
            stageBtns: document.querySelectorAll('.stage-btn'),
            currentGradeSelect: document.getElementById('currentGrade'),
            regionBtns: document.querySelectorAll('.region-btn'),
            schoolCountSlider: document.getElementById('schoolCount'),
            schoolCountLabel: document.getElementById('schoolCountLabel'),
            extraServicesContainer: document.getElementById('extraServices'),
            serviceList: document.getElementById('serviceList'),
            totalPrice: document.getElementById('totalPrice'),

            // Config
            config: {
                planningPerYear: 9000,
                extraSchool: 1000,
                extraServices: {
                    rpCoaching: { label: '研究计划 (RP) 深度辅导', price: 13000 }
                },
                stages: {
                    undergrad: {
                        label: '本科',
                        targetApplicationYear: 12,
                        grades: [
                            { value: 7, label: '初一' }, { value: 8, label: '初二' },
                            { value: 9, label: '初三' }, { value: 10, label: '高一' },
                            { value: 11, label: '高二' }, { value: 12, label: '高三' }
                        ],
                        regions: {
                            commonwealth: { price: 29800, schools: 10, rec: [5,10] },
                            usa: { price: 58000, schools: 10, rec: [8,12] },
                            global: { price: 75000, schools: 20, rec: [15,20] }
                        }
                    },
                    masters: {
                        label: '硕士',
                        targetApplicationYear: 16,
                        grades: [
                            { value: 13, label: '大一' }, { value: 14, label: '大二' },
                            { value: 15, label: '大三' }, { value: 16, label: '大四' }
                        ],
                        regions: {
                            commonwealth: { price: 19800, schools: 7, rec: [5,7] },
                            usa: { price: 39800, schools: 10, rec: [8,10] },
                            global: { price: 55000, schools: 17, rec: [12,17] }
                        }
                    },
                    phd: {
                        label: '博士',
                        targetApplicationYear: 17,
                        grades: [
                            { value: 15, label: '大三' }, { value: 16, label: '大四' },
                            { value: 17, label: '研究生' }
                        ],
                        regions: {
                            commonwealth: { price: 39800, schools: 5, rec: [3,5] },
                            usa: { price: 39800, schools: 5, rec: [3,5] },
                            global: { price: 68000, schools: 10, rec: [5,8] }
                        }
                    }
                }
            },

            // State
            state: {
                stage: 'undergrad',
                grade: 10,
                region: 'commonwealth',
                schools: 10,
                extras: {}
            },

            init() {
                this.addEventListeners();
                this.updateGradeOptions();
                this.update();
            },

            addEventListeners() {
                this.stageBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.state.stage = e.target.dataset.value;
                        this.updateActiveButton(this.stageBtns, this.state.stage);
                        this.updateGradeOptions();
                        this.state.region = 'commonwealth';
                        this.updateActiveButton(this.regionBtns, this.state.region);
                        const baseConfig = this.config.stages[this.state.stage].regions[this.state.region];
                        this.state.schools = baseConfig.schools;
                        this.schoolCountSlider.value = this.state.schools;
                        this.update();
                    });
                });
                
                this.currentGradeSelect.addEventListener('change', (e) => {
                    this.state.grade = parseInt(e.target.value);
                    this.update();
                });

                this.regionBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.state.region = e.target.dataset.value;
                        this.updateActiveButton(this.regionBtns, this.state.region);
                        this.update();
                    });
                });

                this.schoolCountSlider.addEventListener('input', (e) => {
                    this.state.schools = parseInt(e.target.value);
                    this.update();
                });

                this.extraServicesContainer.addEventListener('change', (e) => {
                    if (e.target.type === 'checkbox') {
                        this.state.extras[e.target.id] = e.target.checked;
                        this.update();
                    }
                });
            },

            updateActiveButton(buttons, activeValue) {
                buttons.forEach(b => {
                    if (b.dataset.value === activeValue) {
                        b.classList.add('bg-blue-500', 'text-white');
                        b.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
                    } else {
                        b.classList.remove('bg-blue-500', 'text-white');
                        b.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200');
                    }
                });
            },

            updateGradeOptions() {
                const stageConfig = this.config.stages[this.state.stage];
                this.currentGradeSelect.innerHTML = stageConfig.grades.map(g => `<option value="${g.value}">${g.label}</option>`).join('');
                this.state.grade = stageConfig.grades[0].value;
            },

            update() {
                let total = 0;
                let services = [];
                const stageConfig = this.config.stages[this.state.stage];
                const regionConfig = stageConfig.regions[this.state.region];

                // Update UI elements
                this.schoolCountLabel.textContent = this.state.schools;
                this.updateSliderTrack();
                this.updateExtraServices();

                // --- Core Application Service ---
                total += regionConfig.price;
                services.push({
                    title: `${stageConfig.label}申请核心服务`,
                    items: [
                        `申请地区: ${this.state.region === 'commonwealth' ? '英联邦' : this.state.region === 'usa' ? '美国' : '全球联申'}`,
                        `包含院校数量: ${regionConfig.schools}所`,
                        `标准服务流程 (SOP) 全程跟进`
                    ]
                });

                // --- Extra Schools ---
                if (this.state.schools > regionConfig.schools) {
                    const extra = this.state.schools - regionConfig.schools;
                    const extraCost = extra * this.config.extraSchool;
                    total += extraCost;
                    services.push({
                        title: '额外院校申请',
                        items: [`增加 ${extra} 所院校`]
                    });
                }

                // --- Early Planning ---
                const planningYears = stageConfig.targetApplicationYear - this.state.grade;
                if (planningYears > 0) {
                    let paidYears = planningYears;
                    let freeYears = 0;
                    let planningDetails = [`总规划时长: ${planningYears} 年 (从当前年级到申请季开始)`];

                    if (this.state.stage === 'undergrad') {
                        freeYears = 1;
                        paidYears = Math.max(0, planningYears - 1);
                        planningDetails.push(`其中包含 ${freeYears} 年免费规划`);
                    }
                    
                    if (paidYears > 0) {
                        const planningCost = paidYears * this.config.planningPerYear;
                        total += planningCost;
                        planningDetails.push(`付费规划时长: ${paidYears} 年`);
                    }
                    
                    services.push({
                        title: '长期规划服务',
                        items: planningDetails
                    });
                }
                
                // --- Extra Services ---
                let extraServiceItems = [];
                for (const key in this.state.extras) {
                    if (this.state.extras[key] && this.config.extraServices[key]) {
                        const service = this.config.extraServices[key];
                        total += service.price;
                        extraServiceItems.push(service.label);
                    }
                }
                if (extraServiceItems.length > 0) {
                    services.push({
                        title: '额外选购服务',
                        items: extraServiceItems
                    });
                }

                this.totalPrice.textContent = `¥${total.toLocaleString()}`;
                this.serviceList.innerHTML = services.map(service => `
                    <div class="mb-3">
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200">${service.title}</h4>
                        <ul class="pl-4 mt-1 space-y-1">
                            ${service.items.map(item => `<li class="text-sm text-gray-600 dark:text-gray-400 flex items-start"><span class="text-blue-500 mr-2 mt-1">&#8227;</span><span>${item}</span></li>`).join('')}
                        </ul>
                    </div>
                `).join('');
            },
            
            updateSliderTrack() {
                const slider = this.schoolCountSlider;
                const min = parseInt(slider.min);
                const max = parseInt(slider.max);
                
                const regionConfig = this.config.stages[this.state.stage].regions[this.state.region];
                const [recMin, recMax] = regionConfig.rec;

                const recMinPercent = (recMin - min) / (max - min) * 100;
                const recMaxPercent = (recMax - min) / (max - min) * 100;

                const isDark = document.documentElement.classList.contains('dark');
                const trackColor = isDark ? '#4a5568' : '#e2e8f0';
                const recommendColor = isDark ? '#3b82f6' : '#93c5fd';

                slider.style.background = `linear-gradient(to right, 
                    ${trackColor} 0%, 
                    ${trackColor} ${recMinPercent}%, 
                    ${recommendColor} ${recMinPercent}%, 
                    ${recommendColor} ${recMaxPercent}%, 
                    ${trackColor} ${recMaxPercent}%, 
                    ${trackColor} 100%)`;
            },

            updateExtraServices() {
                let html = '';
                if (this.state.stage === 'phd') {
                    html += `<label class="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                                <input type="checkbox" id="rpCoaching" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <span class="ml-3 text-gray-700 dark:text-gray-300">研究计划 (RP) 深度辅导 (+ ¥${this.config.extraServices.rpCoaching.price.toLocaleString()})</span>
                            </label>`;
                }
                this.extraServicesContainer.innerHTML = html;
            }
        };

        calculator.init();
    });